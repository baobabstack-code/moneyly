import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SummaryPage from '../app/(application)/plan/summary/page';
import { useApplicationStore } from '../lib/store';

const push = jest.fn();
const insert = jest.fn(() => Promise.resolve({ error: null }));
const single = jest.fn(() => Promise.resolve({ data: { full_name: 'John Doe' } }));
const eq = jest.fn(() => ({ single }));
const select = jest.fn(() => ({ eq }));
const getUser = jest.fn(() => Promise.resolve({ data: { user: { id: 'user-1', email: 'user@example.com' } } }));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('../utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return { select };
      }
      return { insert };
    }),
  }),
}));

jest.mock('../utils/pdf-generator', () => ({
  generatePlanPDF: jest.fn(() => Promise.resolve('data:application/pdf;base64,PDF')),
}));

describe('SummaryPage submission', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    push.mockClear();
    insert.mockClear();
    getUser.mockClear();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response));
    useApplicationStore.getState().resetStore();

    const state = useApplicationStore.getState();
    state.setPurchaseDetails({
      productName: 'Laptop',
      plannedCost: '1200',
      savedAmount: '200',
      tenureMonths: '10',
    });
    state.setFileUrl('https://example.com/receipt.png');
  });

  it('inserts the simplified spending plan payload and redirects to success', async () => {
    render(<SummaryPage />);

    fireEvent.click(screen.getByRole('button', { name: /save plan/i }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      store_name: null,
      product_name: 'Laptop',
      planned_cost: 1200,
      saved_amount: 200,
      tenure_months: 10,
      file_url: 'https://example.com/receipt.png',
      status: 'active',
    }));
    expect(push).toHaveBeenCalledWith('/plan/success');
  });
});
