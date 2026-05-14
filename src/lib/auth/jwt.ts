import { SignJWT, jwtVerify } from 'jose'
import { SESSION_MAX_AGE_SEC } from '@/lib/auth/constants'
import {
  emptyPermissions,
  normalizePermissionsMap,
  type PermissionsMap,
} from '@/lib/auth/permissions'

function getSecretBytes(): Uint8Array | null {
  const raw = process.env.AUTH_SESSION_SECRET
  if (!raw || raw.length < 32) return null
  return new TextEncoder().encode(raw)
}

function requireSecret(): Uint8Array {
  const secret = getSecretBytes()
  if (!secret) {
    throw new Error(
      'Set AUTH_SESSION_SECRET in env (at least 32 characters).'
    )
  }
  return secret
}

export type SessionPayload = {
  userId: string
  nama: string
  email: string | null
  groupIds: string[]
  groupNames: string[]
  isSuperuser: boolean
  permissions: PermissionsMap
}

function parseStringArray(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export async function signSession(payload: SessionPayload) {
  const secret = requireSecret()
  return new SignJWT({
    nama: payload.nama,
    email: payload.email,
    gids: JSON.stringify(payload.groupIds),
    gnames: JSON.stringify(payload.groupNames),
    super: payload.isSuperuser,
    perm: JSON.stringify(payload.permissions),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secret)
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  const secret = getSecretBytes()
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    const sub = payload.sub
    if (!sub || typeof payload.nama !== 'string') return null
    const email =
      payload.email === null || payload.email === undefined
        ? null
        : String(payload.email)
    let permissions: PermissionsMap = emptyPermissions()
    if (typeof payload.perm === 'string') {
      try {
        permissions = normalizePermissionsMap(JSON.parse(payload.perm))
      } catch {
        permissions = emptyPermissions()
      }
    }

    let groupIds = parseStringArray(payload.gids)
    let groupNames = parseStringArray(payload.gnames)

    if (groupIds.length === 0 && payload.gid !== undefined && payload.gid !== null) {
      groupIds = [String(payload.gid)]
      if (payload.gname !== undefined && payload.gname !== null) {
        groupNames = [String(payload.gname)]
      }
    }

    return {
      userId: sub,
      nama: payload.nama,
      email,
      groupIds,
      groupNames,
      isSuperuser: Boolean(payload.super),
      permissions,
    }
  } catch {
    return null
  }
}
