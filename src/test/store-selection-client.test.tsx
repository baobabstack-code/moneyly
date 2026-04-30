import { render, screen, fireEvent } from '@testing-library/react'
import StoreSelectionClient from '../app/(application)/store-selection/StoreSelectionClient'

// ── mock next/navigation ───────────────────────────────────────────────────

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ── mock Zustand application store ────────────────────────────────────────

const mockSetSelectedStore = jest.fn()
jest.mock('../lib/store', () => ({
  useApplicationStore: () => ({
    setSelectedStore: mockSetSelectedStore,
  }),
}))

// ── fixtures ───────────────────────────────────────────────────────────────

const stores = [
  {
    id: 1,
    name: 'TV Sales & Home',
    code: 'TVS-001',
    location: "Sam Levy's Village, Borrowdale\nHarare, Zimbabwe",
    hours: '8:00 AM - 6:00 PM',
    logo_url: 'https://example.com/tvsales.png',
  },
  {
    id: 2,
    name: 'Halsted Builders Express',
    code: 'HBE-002',
    location: '71 Plumtree Road, Belmont\nBulawayo, Zimbabwe',
    hours: '9:00 AM - 5:00 PM',
    logo_url: null, // tests the icon fallback path
  },
  {
    id: 3,
    name: 'Electrosales',
    code: 'ELS-003',
    location: '128 Seke Road, Graniteside\nHarare, Zimbabwe',
    hours: '10:00 AM - 9:00 PM',
    logo_url: 'https://example.com/electrosales.png',
  },
]

// ── helpers ────────────────────────────────────────────────────────────────

function setup(storeList = stores) {
  return render(<StoreSelectionClient stores={storeList} />)
}

// ── rendering tests ────────────────────────────────────────────────────────

describe('StoreSelectionClient — rendering', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the page heading', () => {
    setup()
    expect(screen.getByText('Select a Store')).toBeInTheDocument()
  })

  it('renders a tile for every store', () => {
    setup()
    expect(screen.getByText('TV Sales & Home')).toBeInTheDocument()
    expect(screen.getByText('Halsted Builders Express')).toBeInTheDocument()
    expect(screen.getByText('Electrosales')).toBeInTheDocument()
  })

  it('renders store codes', () => {
    setup()
    expect(screen.getByText('TVS-001')).toBeInTheDocument()
    expect(screen.getByText('HBE-002')).toBeInTheDocument()
    expect(screen.getByText('ELS-003')).toBeInTheDocument()
  })

  it('renders store locations', () => {
    setup()
    // whitespace-pre-line means the newline is in the DOM; test just the first line
    expect(screen.getByText(/Sam Levy/)).toBeInTheDocument()
    expect(screen.getByText(/Plumtree Road/)).toBeInTheDocument()
    expect(screen.getByText(/Seke Road/)).toBeInTheDocument()
  })

  it('renders opening hours', () => {
    setup()
    expect(screen.getByText('8:00 AM - 6:00 PM')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument()
    expect(screen.getByText('10:00 AM - 9:00 PM')).toBeInTheDocument()
  })

  it('renders logo img tags for stores with a logo_url', () => {
    setup()
    const imgs = screen.getAllByRole('img')
    // Only stores with logo_url get an <img> — Halsted has none
    expect(imgs).toHaveLength(2)
    expect(imgs[0]).toHaveAttribute('alt', 'TV Sales & Home')
    expect(imgs[1]).toHaveAttribute('alt', 'Electrosales')
  })

  it('shows the step counter', () => {
    setup()
    expect(screen.getByText(/Step 1 of 8/i)).toBeInTheDocument()
  })
})

// ── empty state tests ──────────────────────────────────────────────────────

describe('StoreSelectionClient — empty state', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows empty state message when no stores are passed', () => {
    setup([])
    expect(screen.getByText('No stores available at this time.')).toBeInTheDocument()
  })

  it('does not render any store tiles when stores array is empty', () => {
    setup([])
    expect(screen.queryByText('TV Sales & Home')).not.toBeInTheDocument()
  })
})

// ── interaction tests ──────────────────────────────────────────────────────

describe('StoreSelectionClient — store selection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls setSelectedStore with correct id and name when a tile is clicked', () => {
    setup()
    fireEvent.click(screen.getByText('TV Sales & Home'))
    expect(mockSetSelectedStore).toHaveBeenCalledWith(1, 'TV Sales & Home')
  })

  it('navigates to /apply/lookup after selecting a store', () => {
    setup()
    fireEvent.click(screen.getByText('TV Sales & Home'))
    expect(mockPush).toHaveBeenCalledWith('/apply/lookup')
  })

  it('selects the correct store when a different tile is clicked', () => {
    setup()
    fireEvent.click(screen.getByText('Electrosales'))
    expect(mockSetSelectedStore).toHaveBeenCalledWith(3, 'Electrosales')
    expect(mockPush).toHaveBeenCalledWith('/apply/lookup')
  })

  it('calls setSelectedStore before navigating', () => {
    const callOrder: string[] = []
    mockSetSelectedStore.mockImplementation(() => callOrder.push('setSelectedStore'))
    mockPush.mockImplementation(() => callOrder.push('push'))

    setup()
    fireEvent.click(screen.getByText('Halsted Builders Express'))

    expect(callOrder).toEqual(['setSelectedStore', 'push'])
  })

  it('does not navigate when empty store list is shown', () => {
    setup([])
    // No tiles rendered so no click possible — confirm mocks untouched
    expect(mockSetSelectedStore).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ── partial data tests ─────────────────────────────────────────────────────

describe('StoreSelectionClient — partial store data', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders a store with no logo_url without crashing', () => {
    setup([{ id: 4, name: 'New Branch', code: null, location: null, hours: null, logo_url: null }])
    expect(screen.getByText('New Branch')).toBeInTheDocument()
    // No img rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders a store with no hours without the schedule row', () => {
    setup([{ id: 4, name: 'New Branch', code: 'NB-004', location: null, hours: null, logo_url: null }])
    // hours element absent — material icon 'schedule' not rendered inline
    expect(screen.queryByText(/AM - /)).not.toBeInTheDocument()
  })

  it('still allows selecting a store with partial data', () => {
    setup([{ id: 4, name: 'New Branch', code: null, location: null, hours: null, logo_url: null }])
    fireEvent.click(screen.getByText('New Branch'))
    expect(mockSetSelectedStore).toHaveBeenCalledWith(4, 'New Branch')
    expect(mockPush).toHaveBeenCalledWith('/apply/lookup')
  })
})
