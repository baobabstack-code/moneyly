/**
 * Unit tests for the RLS policy logic expressed as plain JS predicates.
 *
 * We can't run real Postgres RLS here, so we model each policy as a pure
 * function and verify the access-control rules are correct.  These tests
 * serve as living documentation for what each policy enforces.
 */

// ── types ──────────────────────────────────────────────────────────────────

type Profile = { id: string; role: 'customer' | 'admin' | 'super_admin' }
type Store   = { id: number; admin_id: string | null }
type Application = { id: string; user_id: string; store_id: number }

// ── policy predicates (mirror the SQL logic) ───────────────────────────────

/** profiles: customers can see their own row */
function customerCanViewProfile(viewer: Profile, target: Profile) {
  return viewer.id === target.id
}

/** profiles: admins can view profiles of customers who applied to their store */
function adminCanViewProfile(
  viewer: Profile,
  targetId: string,
  stores: Store[],
  applications: Application[]
) {
  if (viewer.role !== 'admin') return false
  const myStore = stores.find(s => s.admin_id === viewer.id)
  if (!myStore) return false
  return applications.some(a => a.store_id === myStore.id && a.user_id === targetId)
}

/** profiles: super_admin can view anyone */
function superAdminCanViewProfile(viewer: Profile) {
  return viewer.role === 'super_admin'
}

/** applications: customers can see their own */
function customerCanViewApplication(viewer: Profile, app: Application) {
  return viewer.role === 'customer' && viewer.id === app.user_id
}

/** applications: admin can view applications for their store */
function adminCanViewApplication(viewer: Profile, app: Application, stores: Store[]) {
  if (viewer.role !== 'admin') return false
  return stores.some(s => s.admin_id === viewer.id && s.id === app.store_id)
}

/** applications: super_admin can view all */
function superAdminCanViewApplication(viewer: Profile) {
  return viewer.role === 'super_admin'
}

/** stores: super_admin full access */
function superAdminCanManageStore(viewer: Profile) {
  return viewer.role === 'super_admin'
}

/** stores: admin can view their own store */
function adminCanViewStore(viewer: Profile, store: Store) {
  return store.admin_id === viewer.id
}

// ── fixtures ───────────────────────────────────────────────────────────────

const customer1: Profile  = { id: 'c1', role: 'customer' }
const customer2: Profile  = { id: 'c2', role: 'customer' }
const admin1: Profile     = { id: 'a1', role: 'admin' }
const admin2: Profile     = { id: 'a2', role: 'admin' }
const superAdmin: Profile = { id: 'sa', role: 'super_admin' }

const store1: Store = { id: 1, admin_id: 'a1' }
const store2: Store = { id: 2, admin_id: 'a2' }
const unassignedStore: Store = { id: 3, admin_id: null }

const stores = [store1, store2, unassignedStore]

const app1: Application = { id: 'app1', user_id: 'c1', store_id: 1 }
const app2: Application = { id: 'app2', user_id: 'c2', store_id: 2 }
const app3: Application = { id: 'app3', user_id: 'c1', store_id: 2 } // c1 also applied to store 2

const applications = [app1, app2, app3]

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
})

describe('RLS — profiles: admin access', () => {
  it('admin can view a customer who applied to their store', () => {
    expect(adminCanViewProfile(admin1, 'c1', stores, applications)).toBe(true)
  })

  it('admin cannot view a customer who only applied to a different store', () => {
    expect(adminCanViewProfile(admin1, 'c2', stores, applications)).toBe(false)
  })

  it('admin of store2 can see c2 who applied to store2', () => {
    expect(adminCanViewProfile(admin2, 'c2', stores, applications)).toBe(true)
  })

  it('admin of store2 can also see c1 who applied to store2 (app3)', () => {
    expect(adminCanViewProfile(admin2, 'c1', stores, applications)).toBe(true)
  })

  it('admin with no assigned store cannot view any profile', () => {
    const unassigned: Profile = { id: 'a_new', role: 'admin' }
    expect(adminCanViewProfile(unassigned, 'c1', stores, applications)).toBe(false)
  })

  it('customer role cannot use admin policy', () => {
    expect(adminCanViewProfile(customer1, 'c2', stores, applications)).toBe(false)
  })
})

describe('RLS — profiles: super_admin access', () => {
  it('super_admin can view any profile', () => {
    expect(superAdminCanViewProfile(superAdmin)).toBe(true)
  })

  it('admin cannot use super_admin policy', () => {
    expect(superAdminCanViewProfile(admin1)).toBe(false)
  })

  it('customer cannot use super_admin policy', () => {
    expect(superAdminCanViewProfile(customer1)).toBe(false)
  })
})

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
})

describe('RLS — applications: admin access', () => {
  it('admin can view applications submitted to their store', () => {
    expect(adminCanViewApplication(admin1, app1, stores)).toBe(true)
  })

  it('admin cannot view applications from a different store', () => {
    expect(adminCanViewApplication(admin1, app2, stores)).toBe(false)
  })

  it('admin2 can view app2 (their store)', () => {
    expect(adminCanViewApplication(admin2, app2, stores)).toBe(true)
  })

  it('admin2 can view app3 (c1 applied to store2)', () => {
    expect(adminCanViewApplication(admin2, app3, stores)).toBe(true)
  })

  it('customer role cannot use admin policy', () => {
    expect(adminCanViewApplication(customer1, app1, stores)).toBe(false)
  })
})

describe('RLS — applications: super_admin access', () => {
  it('super_admin can view all applications', () => {
    expect(superAdminCanViewApplication(superAdmin)).toBe(true)
  })

  it('admin cannot use super_admin application policy', () => {
    expect(superAdminCanViewApplication(admin1)).toBe(false)
  })
})

// ── stores policy tests ────────────────────────────────────────────────────

describe('RLS — stores: super_admin management', () => {
  it('super_admin can manage stores', () => {
    expect(superAdminCanManageStore(superAdmin)).toBe(true)
  })

  it('admin cannot manage stores via super_admin policy', () => {
    expect(superAdminCanManageStore(admin1)).toBe(false)
  })

  it('customer cannot manage stores', () => {
    expect(superAdminCanManageStore(customer1)).toBe(false)
  })
})

describe('RLS — stores: admin view own store', () => {
  it('admin can view the store they are assigned to', () => {
    expect(adminCanViewStore(admin1, store1)).toBe(true)
  })

  it('admin cannot view a store they are not assigned to', () => {
    expect(adminCanViewStore(admin1, store2)).toBe(false)
  })

  it('admin cannot view an unassigned store', () => {
    expect(adminCanViewStore(admin1, unassignedStore)).toBe(false)
  })
})

// ── role hierarchy smoke tests ─────────────────────────────────────────────

describe('role values', () => {
  it('valid roles match expected string literals', () => {
    const validRoles = ['customer', 'admin', 'super_admin']
    expect(validRoles).toContain(customer1.role)
    expect(validRoles).toContain(admin1.role)
    expect(validRoles).toContain(superAdmin.role)
  })
})
