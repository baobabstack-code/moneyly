import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfileSetupClient from '../components/ProfileSetupClient';
import { saveProfile } from '../lib/profile';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: jest.fn() }),
}));

jest.mock('../utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } } })),
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

describe('ProfileSetupClient save', () => {
  beforeEach(() => {
    push.mockClear();
    (saveProfile as jest.Mock).mockClear();
  });

  it('saves simple profile details and redirects to dashboard', async () => {
    render(<ProfileSetupClient initialProfile={null} initialUserId="user-1" />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'johndoe' },
    });
    fireEvent.change(screen.getByLabelText(/monthly income/i), {
      target: { value: '5000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /start using moneyly/i }));

    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
    expect(saveProfile).toHaveBeenCalledWith({
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      monthly_income: '5000',
    });
    expect(push).toHaveBeenCalledWith('/dashboard');
  });
});
