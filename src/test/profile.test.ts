import { isProfileComplete } from '../lib/profile';

describe('isProfileComplete', () => {
  it('returns false for null profile', () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  it('returns true if first_name is set', () => {
    const profile = {
      id: '123',
      full_name: null,
      first_name: 'John',
      last_name: null,
      monthly_income: null,
      avatar_url: null,
      username: null,
      role: 'customer',
    };
    expect(isProfileComplete(profile)).toBe(true);
  });

  it('returns true if full_name is set', () => {
    const profile = {
      id: '123',
      full_name: 'John Doe',
      first_name: null,
      last_name: null,
      monthly_income: null,
      avatar_url: null,
      username: null,
      role: 'customer',
    };
    expect(isProfileComplete(profile)).toBe(true);
  });

  it('returns false if neither first_name nor full_name is set', () => {
    const profile = {
      id: '123',
      full_name: null,
      first_name: null,
      last_name: 'Doe',
      monthly_income: '3000',
      avatar_url: null,
      username: 'johndoe',
      role: 'customer',
    };
    expect(isProfileComplete(profile)).toBe(false);
  });
});
