export const IMPERSONATE_COOKIE = 'htb_impersonate'

export interface ImpersonationData {
  targetUserId: string
  targetName: string
  targetRole: 'customer' | 'admin'
  returnPath: string
  startedAt: number
}

/**
 * Parse the impersonation cookie value server-side.
 * Pass the raw cookie string from `(await cookies()).get(IMPERSONATE_COOKIE)?.value`.
 */
export function parseImpersonationCookie(raw: string | undefined): ImpersonationData | null {
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw)) as ImpersonationData
  } catch {
    return null
  }
}
