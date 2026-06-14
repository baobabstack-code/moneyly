/**
 * Unit tests for the RLS policy logic expressed as plain JS predicates.
 *
 * We can't run real Postgres RLS here, so we model each policy as a pure
 * function and verify the access-control rules are correct.  These tests
 * serve as living documentation for what each policy enforces.
 */

// ── types ──────────────────────────────────────────────────────────────────

type Profile = { id: string; role: 'customer' | 'admin' | 'super_admin' }
type Application = { id: string; user_id: string }

// ── policy predicates (mirror the SQL logic) ───────────────────────────────

/** profiles: customers can see their own row */
function customerCanViewProfile(viewer: Profile, target: Profile) {
  return viewer.id === target.id
}

/** profiles: admins and super admins can view profiles */
function adminCanViewProfile(viewer: Profile) {
  return viewer.role === 'admin' || viewer.role === 'super_admin'
}

/** applications: customers can see their own */
function customerCanViewApplication(viewer: Profile, app: Application) {
  return viewer.role === 'customer' && viewer.id === app.user_id
}

/** applications: admin and super admin can view all applications */
function adminCanViewApplication(viewer: Profile) {
  return viewer.role === 'admin' || viewer.role === 'super_admin'
}

// ── fixtures ───────────────────────────────────────────────────────────────

const customer1: Profile  = { id: 'c1', role: 'customer' }
const customer2: Profile  = { id: 'c2', role: 'customer' }
const admin1: Profile     = { id: 'a1', role: 'admin' }
const superAdmin: Profile = { id: 'sa', role: 'super_admin' }

const app1: Application = { id: 'app1', user_id: 'c1' }
const app2: Application = { id: 'app2', user_id: 'c2' }

// ── profile policy tests ───────────────────────────────────────────────────

describe('RLS — profiles: customer access', () => {
  it('customer can view their own profile', () => {
    expect(customerCanViewProfile(customer1, customer1)).toBe(true)
  })

  it('customer cannot view another customer profile', () => {
    expect(customerCanViewProfile(customer1, customer2)).toBe(false)
  })

  it('admin cannot use customer policy to see a profile', () => {
    expect(customerCanViewProfile(admin1, customer1)).toBe(false)
  })
});

describe('RLS — profiles: admin access', () => {
  it('admin and super admin can view any profile', () => {
    expect(adminCanViewProfile(admin1)).toBe(true)
    expect(adminCanViewProfile(superAdmin)).toBe(true)
  })

  it('customer role cannot use admin profile policy', () => {
    expect(adminCanViewProfile(customer1)).toBe(false)
  })
});

// ── application policy tests ───────────────────────────────────────────────

describe('RLS — applications: customer access', () => {
  it('customer can view their own application', () => {
    expect(customerCanViewApplication(customer1, app1)).toBe(true)
  })

  it('customer cannot view another customer application', () => {
    expect(customerCanViewApplication(customer1, app2)).toBe(false)
  })

  it('admin cannot use customer policy to view applications', () => {
    expect(customerCanViewApplication(admin1, app1)).toBe(false)
  })
});

describe('RLS — applications: admin access', () => {
  it('admin and super admin can view applications', () => {
    expect(adminCanViewApplication(admin1)).toBe(true)
    expect(adminCanViewApplication(superAdmin)).toBe(true)
  })

  it('customer role cannot use admin application policy', () => {
    expect(adminCanViewApplication(customer1)).toBe(false)
  })
});

// ── role hierarchy smoke tests ─────────────────────────────────────────────

describe('role values', () => {
  it('valid roles match expected string literals', () => {
    const validRoles = ['customer', 'admin', 'super_admin']
    expect(validRoles).toContain(customer1.role)
    expect(validRoles).toContain(admin1.role)
    expect(validRoles).toContain(superAdmin.role)
  })
});
