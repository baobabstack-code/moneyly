/**
 * @jest-environment node
 *
 * Tests for the global auth guard in src/utils/supabase/proxy.ts (updateSession).
 *
 * This extends the coverage in middleware-auth.test.ts with specific assertions
 * about the ?next= redirect param — the mechanism that sends users back to the
 * page they were trying to reach after they sign in.
 *
 * Strategy: mock @supabase/ssr so createServerClient returns a controllable
 * stub, call updateSession with synthetic NextRequest objects, and assert on
 * the Location header of redirect responses.
 */

import { NextRequest, NextResponse } from 'next/server'

// ── helpers ────────────────────────────────────────────────────────────────

function req(pathname: string, base = 'http://localhost:3000') {
  return new NextRequest(`${base}${pathname}`)
}

function redirectLocation(response: NextResponse): string | null {
  return response.headers.get('location')
}

function redirectParams(response: NextResponse): URLSearchParams {
  const loc = redirectLocation(response) ?? ''
  return new URL(loc, 'http://localhost:3000').searchParams
}

// ── Supabase mock factory ──────────────────────────────────────────────────

function buildSupabaseMock(user: { id: string } | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    }),
  }
}

// ── module mock ────────────────────────────────────────────────────────────

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

import { createServerClient } from '@supabase/ssr'
import { updateSession } from '../utils/supabase/proxy'

const mockCreateServerClient = createServerClient as jest.Mock

// ── ?next= param on unauthenticated redirects ──────────────────────────────
// The middleware-auth.test.ts suite already verifies redirect status codes.
// These tests focus solely on the ?next= param so LoginClient can return
// users to the page they were trying to reach after signing in.

describe('updateSession — ?next= param in redirect', () => {
  beforeEach(() => {
    mockCreateServerClient.mockReturnValue(buildSupabaseMock(null))
  })

  afterEach(() => jest.clearAllMocks())

  it('includes ?next=/plan/details when redirecting from /plan/details', async () => {
    const res = await updateSession(req('/plan/details'))
    expect(res.status).toBe(307)
    expect(redirectParams(res).get('next')).toBe('/plan/details')
  })

  it('includes ?next=/dashboard when redirecting from /dashboard', async () => {
    const res = await updateSession(req('/dashboard'))
    expect(redirectParams(res).get('next')).toBe('/dashboard')
  })

  it('includes ?next= for deep apply paths', async () => {
    const res = await updateSession(req('/apply/employment-details'))
    expect(redirectParams(res).get('next')).toBe('/apply/employment-details')
  })

  it('includes ?next= for admin paths', async () => {
    const res = await updateSession(req('/admin/applications'))
    expect(redirectParams(res).get('next')).toBe('/admin/applications')
  })

  it('redirects to /login (correct pathname)', async () => {
    const res = await updateSession(req('/plan/details'))
    const loc = new URL(redirectLocation(res)!, 'http://localhost:3000')
    expect(loc.pathname).toBe('/login')
  })
})

// ── public paths do not redirect (no ?next= needed) ───────────────────────

describe('updateSession — public paths pass through', () => {
  beforeEach(() => {
    mockCreateServerClient.mockReturnValue(buildSupabaseMock(null))
  })

  afterEach(() => jest.clearAllMocks())

  it('does not redirect /login', async () => {
    const res = await updateSession(req('/login'))
    expect(res.status).not.toBe(307)
  })

  it('does not redirect /auth/callback', async () => {
    const res = await updateSession(req('/auth/callback'))
    expect(res.status).not.toBe(307)
  })
})

// ── authenticated users pass through ──────────────────────────────────────

describe('updateSession — authenticated user has no ?next= redirect', () => {
  const user = { id: 'user-1' }

  beforeEach(() => {
    mockCreateServerClient.mockReturnValue(buildSupabaseMock(user))
  })

  afterEach(() => jest.clearAllMocks())

  it('passes /plan/details through without redirect', async () => {
    const res = await updateSession(req('/plan/details'))
    expect(res.status).not.toBe(307)
    expect(redirectLocation(res)).toBeNull()
  })

  it('passes /dashboard through without redirect', async () => {
    const res = await updateSession(req('/dashboard'))
    expect(res.status).not.toBe(307)
  })
})
