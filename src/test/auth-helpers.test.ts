/**
 * Tests for getMyRole() and getMyStore() in src/lib/auth.ts.
 * Mocks the Supabase server client so no network calls are made.
 */

jest.mock('../utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '../utils/supabase/server'
import { getMyRole, getMyStore } from '../lib/auth'

const mockCreateClient = createClient as jest.Mock

function buildClient(user: { id: string } | null, profileData: unknown, storeData: unknown) {
  const singleMock = jest.fn()
    .mockResolvedValueOnce({ data: profileData }) // first call → profiles
    .mockResolvedValueOnce({ data: storeData })   // second call → stores

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: singleMock,
    }),
  }
}

// ── getMyRole ──────────────────────────────────────────────────────────────

describe('getMyRole', () => {
  it('returns "customer" when there is no authenticated user', async () => {
    mockCreateClient.mockResolvedValue(buildClient(null, null, null))
    expect(await getMyRole()).toBe('customer')
  })

  it('returns "customer" for an authenticated user with role=customer', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u1' }, { role: 'customer' }, null)
    )
    expect(await getMyRole()).toBe('customer')
  })

  it('returns "admin" for a user whose profile has role=admin', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u2' }, { role: 'admin' }, null)
    )
    expect(await getMyRole()).toBe('admin')
  })

  it('returns "super_admin" for a user whose profile has role=super_admin', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u3' }, { role: 'super_admin' }, null)
    )
    expect(await getMyRole()).toBe('super_admin')
  })

  it('falls back to "customer" when profile row is null (no profile yet)', async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'u4' }, null, null)
    )
    expect(await getMyRole()).toBe('customer')
  })
})

// ── getMyStore ─────────────────────────────────────────────────────────────

describe('getMyStore', () => {
  it('returns null when there is no authenticated user', async () => {
    mockCreateClient.mockResolvedValue(buildClient(null, null, null))
    expect(await getMyStore()).toBeNull()
  })

  it('returns the store assigned to the admin', async () => {
    const store = { id: 1, name: 'Lusaka Branch' }
    mockCreateClient.mockResolvedValue(
      buildClient({ id: 'admin-1' }, { role: 'admin' }, store)
    )
    const singleMock = jest.fn().mockResolvedValueOnce({ data: store })
    const client = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } }) },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: singleMock,
      }),
    }
    mockCreateClient.mockResolvedValue(client)
    expect(await getMyStore()).toEqual(store)
  })

  it('returns null when the user has no store assigned', async () => {
    const singleMock = jest.fn().mockResolvedValueOnce({ data: null })
    const client = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u5' } } }) },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: singleMock,
      }),
    }
    mockCreateClient.mockResolvedValue(client)
    expect(await getMyStore()).toBeNull()
  })
})
