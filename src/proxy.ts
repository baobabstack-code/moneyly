/**
 * AUTHENTICATION PROXY (Next.js Middleware)
 *
 * This file is the single entry point Next.js calls on every matched request.
 * It delegates all logic to updateSession() in utils/supabase/proxy.ts, which
 * handles three responsibilities:
 *
 * 1. SESSION MANAGEMENT
 *    Refreshes the Supabase JWT if it is close to expiring and writes the
 *    updated session cookie onto both the request and the response, keeping
 *    the browser and server in sync.
 *
 * 2. AUTHENTICATION GUARD
 *    Every route is protected by default. Unauthenticated visitors are
 *    redirected to /login?next=<original-path> so that after signing in they
 *    land straight back on the page they were trying to reach.
 *    Public paths (/login, /auth/callback, static assets) bypass this check.
 *
 * 3. ROLE-BASED ROUTE PROTECTION
 *    After confirming a session exists, the user's role is checked for
 *    restricted paths:
 *      - /super-admin/*  → super_admin only
 *      - /admin/*        → admin or super_admin only
 *    Anyone else attempting to visit these paths is redirected to /dashboard.
 *
 * The matcher below runs this proxy on every URL except Next.js internals
 * (_next/static, _next/image), the favicon, the web app manifest, icon
 * assets, and common image formats — none of which need an auth check.
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
