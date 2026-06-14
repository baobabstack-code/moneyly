import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IMPERSONATE_COOKIE } from '@/lib/impersonate'

/**
 * Synchronizes the Supabase authentication session with the Next.js request/response.
 * This is crucial for maintaining a valid session across both client and server components.
 * 
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse object with updated cookies, or a redirect if the user is unauthorized.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isTest = process.env.NODE_ENV === 'test'

  if (!isTest && (!url || !key)) {
    console.warn("Supabase URL or Key is missing in middleware environment variables!")
    return supabaseResponse
  }

  const supabase = createServerClient(
    url!,
    key!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicAsset =
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/_next/')

  if (
    !user &&
    !isPublicAsset &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth') &&
    pathname !== '/'
  ) {
    // Include the original path as ?next= so LoginClient can send the user
    // straight back to where they were trying to go after signing in.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Role-based route protection — skip when a super admin is impersonating
  const impersonateCookie = request.cookies.get(IMPERSONATE_COOKIE)?.value
  const isImpersonating = Boolean(impersonateCookie)

  if (user && !isImpersonating && pathname.startsWith('/super-admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'customer'

    if (role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as is. If you're creating a
  // new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally: return myNewResponse, ensuring that the cookies established by
  //    supabase.auth.getUser() are returned to the browser.

  return supabaseResponse
}
