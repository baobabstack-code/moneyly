/**
 * Tests for getMyRole() in src/lib/auth.ts.
 * Mocks the Supabase server client so no network calls are made.
 */

jest.mock('../utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '../utils/supabase/server'
import { getMyRole } from '../lib/auth'

const mockCreateClient = createClient as jest.Mock

function buildClient(user: { id: string } | null, profileData: unknown) {
  const singleMock = jest.fn().mockResolvedValueOnce({ data: profileData }) // profiles

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: singleMock,
    }),
  }
}

// ── getMyRole ──────────────────────────────────────────────────────────────

describe('getMyRole', () => {
  it('returns "customer" when there is no authenticated user', async () => {
    mockCreateClient.mockResolvedValue(buildClient(null, null))
    expect(await getMyRole()).toBe('customer')
  })

  it('returns "customer" for an authenticated user with role=customer', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u1' }, { role: 'customer' })
    )
    expect(await getMyRole()).toBe('customer')
  })

  it('returns "admin" for a user whose profile has role=admin', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u2' }, { role: 'admin' })
    )
    expect(await getMyRole()).toBe('admin')
  })

  it('returns "super_admin" for a user whose profile has role=super_admin', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u3' }, { role: 'super_admin' })
    )
    expect(await getMyRole()).toBe('super_admin')
  })

  it('falls back to "customer" when profile row is null (no profile yet)', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u4' }, null)
    )
    expect(await getMyRole()).toBe('customer')
  })
})
