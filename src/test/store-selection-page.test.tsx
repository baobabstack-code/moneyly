/**
 * Tests for the store-selection server page (app/(application)/store-selection/page.tsx).
 * Verifies it fetches stores from Supabase and forwards them to StoreSelectionClient.
 *
 * Uses the same render-async-server-component pattern as dashboard-layout.test.tsx.
 */

import { render, screen } from '@testing-library/react'

// ── mock Supabase server client ────────────────────────────────────────────

jest.mock('../utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// ── mock StoreSelectionClient — renders store names so we can assert them ─

jest.mock('../app/(application)/store-selection/StoreSelectionClient', () => ({
  __esModule: true,
  default: ({ stores }: { stores: { id: number; name: string; logo_url: string | null }[] }) => (
    <div data-testid="store-selection-client">
      {stores.length === 0
        ? <p data-testid="empty">no-stores</p>
        : stores.map(s => (
            <div key={s.id} data-testid={`store-${s.id}`}>
              <span data-testid={`name-${s.id}`}>{s.name}</span>
              <span data-testid={`logo-${s.id}`}>{s.logo_url ?? 'NO_LOGO'}</span>
            </div>
          ))
      }
    </div>
  ),
}))

import { createClient } from '../utils/supabase/server'
import StoreSelectionPage from '../app/(application)/store-selection/page'

const mockCreateClient = createClient as jest.Mock

// ── fixture ────────────────────────────────────────────────────────────────

const dbStores = [
  { id: 1, name: 'TV Sales & Home',         code: 'TVS-001', location: 'Harare',   hours: '8am-6pm',  logo_url: 'https://example.com/1.png' },
  { id: 2, name: 'Halsted Builders Express', code: 'HBE-002', location: 'Bulawayo', hours: '9am-5pm',  logo_url: null },
  { id: 3, name: 'Electrosales',             code: 'ELS-003', location: 'Harare',   hours: '10am-9pm', logo_url: 'https://example.com/3.png' },
]

// ── helper: builds a chainable Supabase query mock ─────────────────────────

function buildSupabaseMock(stores: typeof dbStores | null) {
  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order:  jest.fn().mockResolvedValue({ data: stores, error: null }),
    }),
  }
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('StoreSelectionPage — server data fetching', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders StoreSelectionClient', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock(dbStores))
    render(await StoreSelectionPage())
    expect(screen.getByTestId('store-selection-client')).toBeInTheDocument()
  })

  it('passes all three stores from DB to the client component', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock(dbStores))
    render(await StoreSelectionPage())

    expect(screen.getByTestId('store-1')).toBeInTheDocument()
    expect(screen.getByTestId('store-2')).toBeInTheDocument()
    expect(screen.getByTestId('store-3')).toBeInTheDocument()
  })

  it('passes correct store names to the client component', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock(dbStores))
    render(await StoreSelectionPage())

    expect(screen.getByTestId('name-1').textContent).toBe('TV Sales & Home')
    expect(screen.getByTestId('name-2').textContent).toBe('Halsted Builders Express')
    expect(screen.getByTestId('name-3').textContent).toBe('Electrosales')
  })

  it('passes null logo_url through as null (renders NO_LOGO sentinel)', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock(dbStores))
    render(await StoreSelectionPage())
    // Store 2 has logo_url = null — mock renders 'NO_LOGO' for null
    expect(screen.getByTestId('logo-2').textContent).toBe('NO_LOGO')
  })

  it('passes logo_url string through unchanged', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock(dbStores))
    render(await StoreSelectionPage())
    expect(screen.getByTestId('logo-1').textContent).toBe('https://example.com/1.png')
  })

  it('passes empty array when DB returns null', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock(null))
    render(await StoreSelectionPage())
    expect(screen.getByTestId('empty')).toBeInTheDocument()
    expect(screen.queryByTestId('store-1')).not.toBeInTheDocument()
  })

  it('passes empty array when DB returns empty array', async () => {
    mockCreateClient.mockResolvedValue(buildSupabaseMock([]))
    render(await StoreSelectionPage())
    expect(screen.getByTestId('empty')).toBeInTheDocument()
  })

  it('preserves the order of stores returned by the DB', async () => {
    const reversed = [...dbStores].reverse() // ids: 3, 2, 1
    mockCreateClient.mockResolvedValue(buildSupabaseMock(reversed))
    render(await StoreSelectionPage())

    const storeEls = screen.getAllByTestId(/^store-\d/)
    const ids = storeEls.map(el => el.getAttribute('data-testid'))
    expect(ids).toEqual(['store-3', 'store-2', 'store-1'])
  })

  it('queries the stores table with correct columns', async () => {
    const client = buildSupabaseMock(dbStores)
    mockCreateClient.mockResolvedValue(client)
    render(await StoreSelectionPage())

    expect(client.from).toHaveBeenCalledWith('stores')
    expect(client.from().select).toHaveBeenCalledWith('id, name, code, location, hours, logo_url')
  })
})
