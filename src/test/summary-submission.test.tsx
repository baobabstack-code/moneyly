import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SummaryPage from '../app/(application)/apply/summary/page';
import { useApplicationStore } from '../lib/store';

const push = jest.fn();
const insert = jest.fn(() => Promise.resolve({ error: null }));
const getUser = jest.fn(() => Promise.resolve({ data: { user: { id: 'user-1', email: 'user@example.com' } } }));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('../utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser },
    from: () => ({ insert }),
  }),
}));

jest.mock('../utils/pdf-generator', () => ({
  generateLoanPDF: jest.fn(() => Promise.resolve('data:application/pdf;base64,PDF')),
}));

describe('SummaryPage submission', () => {
  beforeEach(() => {
    push.mockClear();
    insert.mockClear();
    getUser.mockClear();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response));
    useApplicationStore.getState().resetStore();

    const state = useApplicationStore.getState();
    state.setSelectedStore(1, 'Test Store');
    state.setLookup({ nationalId: '63-1234567K00', customerFound: true });
    state.setBasicInfo({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      photoUrl: '',
    });
    state.setContactDetails({
      physicalAddress: '123 Main Street',
      mobileNumber: '+263771234567',
      emailAddress: 'john@example.com',
    });
    state.setPurchaseDetails({
      productName: 'Laptop',
      retailPrice: '1200',
      depositAmount: '200',
      tenureMonths: '10',
    });
    state.setEmploymentDetails({
      employerName: 'Employer Inc',
      isCivilServant: false,
      phoneNumber: '+263242123456',
      contactPerson: 'Mary Manager',
      emailAddress: 'hr@employer.test',
      physicalAddress: '789 Work Avenue, Harare',
    });
    state.setNextOfKin({
      fullName: 'Jane Doe',
      relationship: 'Spouse',
      mobileNumber: '+263772345678',
      address: '456 Main Street',
    });
    state.setDocumentUploads({
      idCopyUrl: 'https://example.com/id.png',
      payslipUrl: 'https://example.com/payslip.pdf',
    });
  });

  it('inserts the full application payload including employer contact details', async () => {
    render(<SummaryPage />);

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      employer_phone: '+263242123456',
      employer_contact_person: 'Mary Manager',
      employer_email: 'hr@employer.test',
      employer_address: '789 Work Avenue, Harare',
    }));
    expect(push).toHaveBeenCalledWith('/success');
  });
});
