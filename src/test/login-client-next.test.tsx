/**
 * Tests for the `next` redirect prop added to LoginClient.
 *
 * After the auth-guard middleware was introduced every protected route
 * redirects unauthenticated users to /login?next=<original-path>.
 * LoginClient receives that path as the `next` prop and must use it in
 * three places:
 *   1. Email/password sign-in  → router.push(next)
 *   2. Google OAuth redirect   → redirectTo includes encoded next
 *   3. Sign-up email link      → emailRedirectTo includes encoded next
 *
 * Strategy: mock next/navigation, the Supabase browser client, and
 * window.location.origin so we can assert on where the user ends up
 * after each auth path.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import LoginClient from '../components/LoginClient'

// ── mock next/navigation ───────────────────────────────────────────────────

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// ── mock Supabase browser client ───────────────────────────────────────────

const mockSignInWithPassword = jest.fn()
const mockSignInWithOAuth = jest.fn()
const mockSignUp = jest.fn()

jest.mock('../utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signUp: mockSignUp,
    },
  }),
}))

// ── window.location note ───────────────────────────────────────────────────
// jsdom sets window.location as non-configurable so it cannot be replaced or
// spied on. However jsdom's default testURL gives window.location.origin the
// value 'http://localhost', which is exactly what the component uses when
// building the redirectTo / emailRedirectTo URLs. No stub needed — we just
// assert that the URL *contains* the encoded path, ignoring the origin prefix.

// ── helpers ────────────────────────────────────────────────────────────────

/** Fill in email + password fields and submit the form. */
async function submitEmailLogin(email = 'user@test.com', password = 'password123') {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('personal@email.com'), {
      target: { value: email },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: password },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  })
}

/** Click the "Don't have an account? Create one" toggle to switch to sign-up mode. */
async function switchToSignUp() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /create one/i }))
  })
}

// ── default behaviour (no next prop) ──────────────────────────────────────

describe('LoginClient — default redirect (no next prop)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    })
  })

  it('redirects to /dashboard when no next prop is provided', async () => {
    render(<LoginClient />)
    await submitEmailLogin()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })
})

// ── email / password sign-in with next prop ────────────────────────────────

describe('LoginClient — email sign-in respects next prop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    })
  })

  it('redirects to /plan/details after successful sign-in', async () => {
    render(<LoginClient next="/plan/details" />)
    await submitEmailLogin()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/plan/details'))
  })

  it('redirects to a deep apply path after successful sign-in', async () => {
    render(<LoginClient next="/apply/employment-details" />)
    await submitEmailLogin()
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/apply/employment-details')
    )
  })

  it('redirects to /dashboard when next is explicitly /dashboard', async () => {
    render(<LoginClient next="/dashboard" />)
    await submitEmailLogin()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })

  it('shows an error message and does not redirect when sign-in fails', async () => {
    // The component does `if (error) throw error`, so the mock must return
    // a real Error so the catch block sets the message correctly via instanceof Error.
    const authError = new Error('Invalid login credentials')
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: authError,
    })

    render(<LoginClient next="/plan/details" />)
    await submitEmailLogin()

    await waitFor(() =>
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when sign-in succeeds but returns no session', async () => {
    // Edge case: no error but also no session (e.g. email not yet confirmed)
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(<LoginClient next="/plan/details" />)
    await submitEmailLogin()

    // Give the async handler time to settle
    await act(async () => {})
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// ── Google OAuth redirect includes next ────────────────────────────────────

describe('LoginClient — Google OAuth encodes next in redirectTo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignInWithOAuth.mockResolvedValue({ error: null })
  })

  it('includes encoded /plan/details as the next param in the OAuth redirect', async () => {
    render(<LoginClient next="/plan/details" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    })

    await waitFor(() => expect(mockSignInWithOAuth).toHaveBeenCalled())

    const [call] = mockSignInWithOAuth.mock.calls
    const redirectTo: string = call[0].options.redirectTo
    expect(redirectTo).toContain('/auth/callback')
    expect(redirectTo).toContain(encodeURIComponent('/plan/details'))
  })

  it('defaults OAuth redirectTo to /dashboard when no next prop is supplied', async () => {
    render(<LoginClient />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    })

    await waitFor(() => expect(mockSignInWithOAuth).toHaveBeenCalled())

    const [call] = mockSignInWithOAuth.mock.calls
    const redirectTo: string = call[0].options.redirectTo
    expect(redirectTo).toContain(encodeURIComponent('/dashboard'))
  })

  it('uses the correct OAuth provider (google)', async () => {
    render(<LoginClient next="/plan/details" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    })

    await waitFor(() => expect(mockSignInWithOAuth).toHaveBeenCalled())
    expect(mockSignInWithOAuth.mock.calls[0][0].provider).toBe('google')
  })
})

// ── sign-up email link includes next ──────────────────────────────────────

describe('LoginClient — sign-up email link encodes next', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignUp.mockResolvedValue({ error: null })
  })

  async function fillAndSubmitSignUp(email = 'new@test.com', password = 'password123') {
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('personal@email.com'), {
        target: { value: email },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: password },
      })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })
  }

  it('includes encoded /plan/details in the email verification link', async () => {
    render(<LoginClient next="/plan/details" />)
    await switchToSignUp()
    await fillAndSubmitSignUp()

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled())

    const [call] = mockSignUp.mock.calls
    const emailRedirectTo: string = call[0].options.emailRedirectTo
    expect(emailRedirectTo).toContain('/auth/callback')
    expect(emailRedirectTo).toContain(encodeURIComponent('/plan/details'))
  })

  it('shows a verification-sent message after sign-up and does not navigate', async () => {
    render(<LoginClient next="/plan/details" />)
    await switchToSignUp()
    await fillAndSubmitSignUp()

    await waitFor(() =>
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('defaults emailRedirectTo to /dashboard when no next prop is supplied', async () => {
    render(<LoginClient />)
    await switchToSignUp()
    await fillAndSubmitSignUp()

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled())

    const [call] = mockSignUp.mock.calls
    const emailRedirectTo: string = call[0].options.emailRedirectTo
    expect(emailRedirectTo).toContain(encodeURIComponent('/dashboard'))
  })
})
