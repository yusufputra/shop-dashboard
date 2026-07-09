import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '@/lib/auth/constants'

/** Secure cookies are ignored on http:// (e.g. bundled Tauri server on 127.0.0.1). */
export function sessionCookieSecure(request: Request): boolean {
  return new URL(request.url).protocol === 'https:'
}

export function sessionCookieOptions(request: Request, maxAge: number) {
  return {
    httpOnly: true,
    secure: sessionCookieSecure(request),
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC }
