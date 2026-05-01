import { fireEvent, render, screen } from '@testing-library/react';
import EmploymentDetailsPage from '../app/(application)/apply/employment-details/page';
import { useApplicationStore } from '../lib/store';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('EmploymentDetailsPage', () => {
  beforeEach(() => {
    push.mockClear();
    useApplicationStore.getState().resetStore();
  });

  it('keeps Continue disabled until required employer contact details are captured', () => {
    render(<EmploymentDetailsPage />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/name of employer/i), {
      target: { value: 'Employer Inc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^no$/i }));
    fireEvent.change(screen.getByLabelText(/employer phone number/i), {
      target: { value: '+263242123456' },
    });
    fireEvent.change(screen.getByLabelText(/employer contact person/i), {
      target: { value: 'Mary Manager' },
    });
    fireEvent.change(screen.getByLabelText(/employer address/i), {
      target: { value: '789 Work Avenue, Harare' },
    });

    expect(continueButton).toBeEnabled();
  });

  it('persists richer employer fields in the application store', () => {
    render(<EmploymentDetailsPage />);

    fireEvent.change(screen.getByLabelText(/employer contact person/i), {
      target: { value: 'Mary Manager' },
    });
    fireEvent.change(screen.getByLabelText(/employer email/i), {
      target: { value: 'hr@employer.test' },
    });
    fireEvent.change(screen.getByLabelText(/employer address/i), {
      target: { value: '789 Work Avenue, Harare' },
    });

    const state = useApplicationStore.getState();
    expect(state.employmentDetails.contactPerson).toBe('Mary Manager');
    expect(state.employmentDetails.emailAddress).toBe('hr@employer.test');
    expect(state.employmentDetails.physicalAddress).toBe('789 Work Avenue, Harare');
  });
});
