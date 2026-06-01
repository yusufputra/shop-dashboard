import type { SessionPayload } from '@/lib/auth/jwt'

export function createdByFields(session: SessionPayload | null) {
  return {
    created_by: session?.userId ?? null,
    created_by_nama: session?.nama?.trim() || null,
  }
}

export function formatCreatedByLabel(nama: string | null | undefined): string {
  const t = nama?.trim()
  return t || '—'
}
