import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfileSetupClient from '../components/ProfileSetupClient';
import { saveProfile } from '../lib/profile';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('section=employment'),
}));

jest.mock('../utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-1' } } } })),
    },
  }),
}));

jest.mock('../lib/profile', () => {
  const actual = jest.requireActual('../lib/profile');
  return {
    ...actual,
    saveProfile: jest.fn(() => Promise.resolve({ id: 'user-1' })),
  };
});

describe('ProfileSetupClient employment save', () => {
  beforeEach(() => {
    push.mockClear();
    (saveProfile as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('saves richer employer details to the profile', async () => {
    render(<ProfileSetupClient initialProfile={null} initialUserId="user-1" />);

    fireEvent.click(screen.getByRole('button', { name: /^no$/i }));
    fireEvent.change(screen.getByLabelText(/employer name/i), {
      target: { value: 'Employer Inc' },
    });
    fireEvent.change(screen.getByLabelText(/employer phone/i), {
      target: { value: '+263242123456' },
    });
    fireEvent.change(screen.getByLabelText(/employer contact person/i), {
      target: { value: 'Mary Manager' },
    });
    fireEvent.change(screen.getByLabelText(/employer email/i), {
      target: { value: 'hr@employer.test' },
    });
    fireEvent.change(screen.getByLabelText(/employer address/i), {
      target: { value: '789 Work Avenue, Harare' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /complete profile/i })[0]);

    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({
      employer_name: 'Employer Inc',
      employment_phone: '+263242123456',
      employer_contact_person: 'Mary Manager',
      employer_email: 'hr@employer.test',
      employer_address: '789 Work Avenue, Harare',
    }));
  });
});
