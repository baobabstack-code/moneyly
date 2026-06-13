/**
 * @jest-environment node
 *
 * Tests for role-based route protection in updateSession (proxy.ts).
 *
 * Strategy: mock @supabase/ssr so createServerClient returns a controllable
 * supabase stub, then call updateSession with synthetic NextRequest objects and
 * assert on the returned response's status / Location header.
 */

import { NextRequest, NextResponse } from 'next/server'

// ── helpers ────────────────────────────────────────────────────────────────

function makeRequest(pathname: string, base = 'http://localhost:3000') {
  return new NextRequest(`${base}${pathname}`)
}

function redirectLocation(response: NextResponse): string | null {
  return response.headers.get('location')
}

// ── mock factory ───────────────────────────────────────────────────────────

type MockProfile = { role: string } | null

function buildSupabaseMock(user: { id: string } | null, profile: MockProfile) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: profile }),
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

// ── tests ──────────────────────────────────────────────────────────────────

describe('updateSession — unauthenticated redirects', () => {
  beforeEach(() => {
    mockCreateServerClient.mockImplementation(() => buildSupabaseMock(null, null))
  })

  it('redirects unauthenticated user visiting /dashboard to /login', async () => {
    const res = await updateSession(makeRequest('/dashboard'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/login')
  })

  it('redirects unauthenticated user visiting /admin to /login', async () => {
    const res = await updateSession(makeRequest('/admin'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/login')
  })

  it('allows unauthenticated user to visit /', async () => {
    const res = await updateSession(makeRequest('/'))
    expect(res.status).not.toBe(307)
  })

  it('allows unauthenticated user to visit /login', async () => {
    const res = await updateSession(makeRequest('/login'))
    expect(res.status).not.toBe(307)
  })

  it('allows unauthenticated user to visit /auth/callback', async () => {
    const res = await updateSession(makeRequest('/auth/callback'))
    expect(res.status).not.toBe(307)
  })

  it('allows /_next/ asset requests through without redirect', async () => {
    const res = await updateSession(makeRequest('/_next/static/chunk.js'))
    expect(res.status).not.toBe(307)
  })

  it('allows /manifest.json through', async () => {
    const res = await updateSession(makeRequest('/manifest.json'))
    expect(res.status).not.toBe(307)
  })
})

describe('updateSession — customer role restrictions', () => {
  const user = { id: 'user-1' }

  beforeEach(() => {
    mockCreateServerClient.mockImplementation(() =>
      buildSupabaseMock(user, { role: 'customer' })
    )
  })

  it('allows customer to visit /dashboard', async () => {
    const res = await updateSession(makeRequest('/dashboard'))
    expect(res.status).not.toBe(307)
  })

  it('redirects customer away from /admin to /dashboard', async () => {
    const res = await updateSession(makeRequest('/admin'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/dashboard')
  })

  it('redirects customer away from /admin/applications to /dashboard', async () => {
    const res = await updateSession(makeRequest('/admin/applications'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/dashboard')
  })

  it('redirects customer away from /super-admin to /dashboard', async () => {
    const res = await updateSession(makeRequest('/super-admin'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/dashboard')
  })
})

describe('updateSession — admin role permissions', () => {
  const user = { id: 'admin-1' }

  beforeEach(() => {
    mockCreateServerClient.mockImplementation(() =>
      buildSupabaseMock(user, { role: 'admin' })
    )
  })

  it('allows admin to visit /admin', async () => {
    const res = await updateSession(makeRequest('/admin'))
    expect(res.status).not.toBe(307)
  })

  it('allows admin to visit /admin/applications', async () => {
    const res = await updateSession(makeRequest('/admin/applications'))
    expect(res.status).not.toBe(307)
  })

  it('allows admin to visit /admin/customers', async () => {
    const res = await updateSession(makeRequest('/admin/customers'))
    expect(res.status).not.toBe(307)
  })

  it('redirects admin away from /super-admin to /dashboard', async () => {
    const res = await updateSession(makeRequest('/super-admin'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/dashboard')
  })
})

describe('updateSession — super_admin role permissions', () => {
  const user = { id: 'superadmin-1' }

  beforeEach(() => {
    mockCreateServerClient.mockImplementation(() =>
      buildSupabaseMock(user, { role: 'super_admin' })
    )
  })

  it('allows super_admin to visit /admin', async () => {
    const res = await updateSession(makeRequest('/admin'))
    expect(res.status).not.toBe(307)
  })

  it('allows super_admin to visit /super-admin', async () => {
    const res = await updateSession(makeRequest('/super-admin'))
    expect(res.status).not.toBe(307)
  })

  it('allows super_admin to visit /super-admin/business-partners', async () => {
    const res = await updateSession(makeRequest('/super-admin/business-partners'))
    expect(res.status).not.toBe(307)
  })
})

describe('updateSession — profile DB unavailable (graceful fallback)', () => {
  const user = { id: 'user-x' }

  beforeEach(() => {
    // profile query returns null — role defaults to 'customer'
    mockCreateServerClient.mockImplementation(() =>
      buildSupabaseMock(user, null)
    )
  })

  it('treats missing profile as customer — blocks /admin', async () => {
    const res = await updateSession(makeRequest('/admin'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/dashboard')
  })

  it('treats missing profile as customer — blocks /super-admin', async () => {
    const res = await updateSession(makeRequest('/super-admin'))
    expect(res.status).toBe(307)
    expect(redirectLocation(res)).toContain('/dashboard')
  })
})
