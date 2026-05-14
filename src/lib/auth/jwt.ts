import { SignJWT, jwtVerify } from 'jose'
import { SESSION_MAX_AGE_SEC } from '@/lib/auth/constants'

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
}

export async function signSession(payload: SessionPayload) {
  const secret = requireSecret()
  return new SignJWT({
    nama: payload.nama,
    email: payload.email,
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
    return { userId: sub, nama: payload.nama, email }
  } catch {
    return null
  }
}
