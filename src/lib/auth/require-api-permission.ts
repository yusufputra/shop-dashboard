import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { verifySession, type SessionPayload } from '@/lib/auth/jwt'
import { canAccess, type MenuKey, type PermissionAction } from '@/lib/auth/permissions'

export async function requirePermission(
  menu: MenuKey,
  action: PermissionAction
): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Belum masuk' }, { status: 401 }),
    }
  }
  if (!canAccess(session.isSuperuser, session.permissions, menu, action)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Tidak punya izin' }, { status: 403 }),
    }
  }
  return { ok: true, session }
}

export async function requireAnyPermission(
  alternatives: { menu: MenuKey; action: PermissionAction }[]
): Promise<
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Belum masuk' }, { status: 401 }),
    }
  }
  if (session.isSuperuser) {
    return { ok: true, session }
  }
  const allowed = alternatives.some((alt) =>
    canAccess(session.isSuperuser, session.permissions, alt.menu, alt.action)
  )
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Tidak punya izin' }, { status: 403 }),
    }
  }
  return { ok: true, session }
}
