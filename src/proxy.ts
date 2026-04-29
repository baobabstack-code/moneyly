/**
 * AUTHENTICATION PROXY (Next.js Middleware)
 * 
 * This file acts as a gatekeeper for the application. 
 * It intercepts all requests and performs two critical tasks:
 * 
 * 1. SESSION MANAGEMENT: It calls 'updateSession' to ensure the user's Supabase session 
 *    is refreshed and synced with the request/response cookies.
 * 
 * 2. ROUTE PROTECTION: It enforces authentication for specific routes.
 *    Any route matching the 'matcher' pattern below will trigger this check.
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
