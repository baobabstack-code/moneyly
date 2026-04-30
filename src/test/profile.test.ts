import { isProfileComplete } from '../lib/profile';

describe('isProfileComplete', () => {
  it('returns false for null profile', () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  it('returns true for complete profile', () => {
    const profile = {
      id: '123',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      national_id: '12345',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      photo_url: 'data:image/png;base64,',
      physical_address: '123 Main St',
      mobile_number: '+263771234567',
      email_address: 'john@example.com',
      nok_full_name: 'Jane Doe',
      nok_address: '456 Main St',
      nok_mobile_number: '+263771234567',
      nok_relationship: 'Spouse',
      employer_name: 'Employer Inc',
      employer_no: '',
      ministry: '',
      is_civil_servant: false,
      monthly_income: '1000',
      employment_phone: '+263242123456',
      employer_contact_person: 'Mary Manager',
      employer_email: 'hr@example.com',
      employer_address: '789 Work Ave',
      avatar_url: null,
      username: null,
      is_profile_complete: true,
    };
    expect(isProfileComplete(profile)).toBe(true);
  });

  it('returns false when missing email', () => {
    const profile = {
      id: '123',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      national_id: '12345',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      photo_url: 'data:image/png;base64,',
      physical_address: '123 Main St',
      mobile_number: '+263771234567',
      email_address: null,
      nok_full_name: 'Jane Doe',
      nok_address: '456 Main St',
      nok_mobile_number: '+263771234567',
      nok_relationship: 'Spouse',
      employer_name: 'Employer Inc',
      employer_no: '',
      ministry: '',
      is_civil_servant: false,
      monthly_income: '1000',
      employment_phone: '',
      avatar_url: null,
      username: null,
      is_profile_complete: true,
    };
    expect(isProfileComplete(profile)).toBe(false);
  });

  it('returns false when missing next of kin', () => {
    const profile = {
      id: '123',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      national_id: '12345',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      photo_url: 'data:image/png;base64,',
      physical_address: '123 Main St',
      mobile_number: '+263771234567',
      email_address: 'john@example.com',
      nok_full_name: '',
      nok_address: '456 Main St',
      nok_mobile_number: '+263771234567',
      nok_relationship: 'Spouse',
      employer_name: 'Employer Inc',
      employer_no: '',
      ministry: '',
      is_civil_servant: false,
      monthly_income: '1000',
      employment_phone: '',
      avatar_url: null,
      username: null,
      is_profile_complete: true,
    };
    expect(isProfileComplete(profile)).toBe(false);
  });

  it('returns false when is_profile_complete is false', () => {
    const profile = {
      id: '123',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      national_id: '12345',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      photo_url: 'data:image/png;base64,',
      physical_address: '123 Main St',
      mobile_number: '+263771234567',
      email_address: 'john@example.com',
      nok_full_name: 'Jane Doe',
      nok_address: '456 Main St',
      nok_mobile_number: '+263771234567',
      nok_relationship: 'Spouse',
      employer_name: 'Employer Inc',
      employer_no: '',
      ministry: '',
      is_civil_servant: false,
      monthly_income: '1000',
      employment_phone: '',
      avatar_url: null,
      username: null,
      is_profile_complete: false,
    };
    expect(isProfileComplete(profile)).toBe(false);
  });
});
