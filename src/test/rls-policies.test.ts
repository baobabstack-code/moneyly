/**
 * Unit tests for the RLS policy logic expressed as plain JS predicates.
 *
 * We can't run real Postgres RLS here, so we model each policy as a pure
 * function and verify the access-control rules are correct.  These tests
 * serve as living documentation for what each policy enforces.
 */

// ── types ──────────────────────────────────────────────────────────────────

type Profile = { id: string; role: 'customer' | 'super_admin' }
type SpendingPlan = { id: string; user_id: string }

// ── policy predicates (mirror the SQL logic) ───────────────────────────────

/** profiles: customers can see their own row */
function customerCanViewProfile(viewer: Profile, target: Profile) {
  return viewer.id === target.id
}

/** profiles: super admins can view profiles */
function superAdminCanViewProfile(viewer: Profile) {
  return viewer.role === 'super_admin'
}

/** spending plans: customers can see their own */
function customerCanViewPlan(viewer: Profile, plan: SpendingPlan) {
  return viewer.role === 'customer' && viewer.id === plan.user_id
}

/** spending plans: super admin can view all spending plans */
function superAdminCanViewPlan(viewer: Profile) {
  return viewer.role === 'super_admin'
}

// ── fixtures ───────────────────────────────────────────────────────────────

const customer1: Profile  = { id: 'c1', role: 'customer' }
const customer2: Profile  = { id: 'c2', role: 'customer' }
const superAdmin: Profile = { id: 'sa', role: 'super_admin' }

const plan1: SpendingPlan = { id: 'plan1', user_id: 'c1' }
const plan2: SpendingPlan = { id: 'plan2', user_id: 'c2' }

// ── profile policy tests ───────────────────────────────────────────────────

describe('RLS — profiles: customer access', () => {
  it('customer can view their own profile', () => {
    expect(customerCanViewProfile(customer1, customer1)).toBe(true)
  })

  it('customer cannot view another customer profile', () => {
    expect(customerCanViewProfile(customer1, customer2)).toBe(false)
  })

  it('super admin cannot use customer policy to see a profile', () => {
    expect(customerCanViewProfile(superAdmin, customer1)).toBe(false)
  })
});

describe('RLS — profiles: super admin access', () => {
  it('super admin can view any profile', () => {
    expect(superAdminCanViewProfile(superAdmin)).toBe(true)
  })

  it('customer role cannot use super admin profile policy', () => {
    expect(superAdminCanViewProfile(customer1)).toBe(false)
  })
});

// ── spending plan policy tests ─────────────────────────────────────────────

describe('RLS — spending plans: customer access', () => {
  it('customer can view their own spending plan', () => {
    expect(customerCanViewPlan(customer1, plan1)).toBe(true)
  })

  it('customer cannot view another customer spending plan', () => {
    expect(customerCanViewPlan(customer1, plan2)).toBe(false)
  })

  it('super admin cannot use customer policy to view spending plans', () => {
    expect(customerCanViewPlan(superAdmin, plan1)).toBe(false)
  })
});

describe('RLS — spending plans: super admin access', () => {
  it('super admin can view spending plans', () => {
    expect(superAdminCanViewPlan(superAdmin)).toBe(true)
  })

  it('customer role cannot use super admin spending plan policy', () => {
    expect(superAdminCanViewPlan(customer1)).toBe(false)
  })
});

// ── role hierarchy smoke tests ─────────────────────────────────────────────

describe('role values', () => {
  it('valid roles match expected string literals', () => {
    const validRoles = ['customer', 'super_admin']
    expect(validRoles).toContain(customer1.role)
    expect(validRoles).toContain(superAdmin.role)
  })
});
