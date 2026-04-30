import { render, screen } from '@testing-library/react';
import DashboardLayout from '../app/dashboard/layout';

const single = jest.fn();
const eq = jest.fn(() => ({ single }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));
const getSession = jest.fn();

jest.mock('../utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getSession },
    from,
  })),
}));

jest.mock('../components/layout/Navbar', () => function MockNavbar() {
  return <div data-testid="navbar">Navbar</div>;
});

jest.mock('../components/DashboardSidebar', () => function MockDashboardSidebar() {
  return <div data-testid="dashboard-sidebar">Sidebar</div>;
});

jest.mock('../components/MobileBottomNav', () => function MockMobileBottomNav() {
  return <div data-testid="mobile-bottom-nav">Mobile Nav</div>;
});

const completeProfile = {
  first_name: 'John',
  full_name: 'John Doe',
  national_id: '63-1234567K00',
  date_of_birth: '1990-01-01',
  gender: 'Male',
  physical_address: '123 Main Street',
  mobile_number: '+263771234567',
  email_address: 'john@example.com',
  nok_full_name: 'Jane Doe',
  nok_address: '456 Main Street',
  nok_mobile_number: '+263772345678',
  nok_relationship: 'Spouse',
  employer_name: 'Employer Inc',
  is_civil_servant: false,
  employment_phone: '+263242123456',
  employer_contact_person: 'Mary Manager',
  employer_address: '789 Work Avenue, Harare',
  photo_url: 'photo.png',
  avatar_url: null,
  is_profile_complete: true,
};

describe('DashboardLayout sidebar gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'john@example.com',
            user_metadata: {},
          },
        },
      },
    });
  });

  it('hides sidebar and mobile nav for incomplete profiles', async () => {
    single.mockResolvedValue({ data: { ...completeProfile, employment_phone: '', is_profile_complete: true } });

    render(await DashboardLayout({ children: <div>Dashboard content</div> }));

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-bottom-nav')).not.toBeInTheDocument();
  });

  it('shows sidebar and mobile nav for complete profiles', async () => {
    single.mockResolvedValue({ data: completeProfile });

    render(await DashboardLayout({ children: <div>Dashboard content</div> }));

    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
  });
});
