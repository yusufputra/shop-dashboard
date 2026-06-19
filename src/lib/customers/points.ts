import type { CustomerPointLedger, CustomerPointRedeem } from '@/types/database'

/** Saldo poin mentah (desimal) dibulatkan ke bawah untuk tampilan & redeem. */
export function displayPoints(rawPoints: number): number {
  if (!Number.isFinite(rawPoints) || rawPoints <= 0) return 0
  return Math.floor(rawPoints)
}

export function sumActiveLedgerPoints(
  ledger: CustomerPointLedger[],
  now: Date = new Date()
): number {
  return ledger.reduce((sum, row) => {
    if (new Date(row.expires_at) > now) return sum + row.points
    return sum
  }, 0)
}

export function sumRedeemedPoints(redeems: CustomerPointRedeem[]): number {
  return redeems.reduce((sum, row) => sum + row.points, 0)
}

export function computeAvailablePoints(
  ledger: CustomerPointLedger[],
  redeems: CustomerPointRedeem[],
  now: Date = new Date()
): number {
  return sumActiveLedgerPoints(ledger, now) - sumRedeemedPoints(redeems)
}

export type PointHistoryKind = 'earn' | 'redeem' | 'expired'

export type PointHistoryEntry = {
  id: string
  kind: PointHistoryKind
  date: string
  points: number
  refType?: string
  refKey?: string
  weightGrams?: number
  expiresAt?: string
  keterangan?: string | null
  createdByNama?: string | null
}

export function buildPointHistory(
  ledger: CustomerPointLedger[],
  redeems: CustomerPointRedeem[],
  now: Date = new Date()
): PointHistoryEntry[] {
  const entries: PointHistoryEntry[] = []

  for (const row of ledger) {
    const expired = new Date(row.expires_at) <= now
    entries.push({
      id: row.ledger_id,
      kind: expired ? 'expired' : 'earn',
      date: row.created_at,
      points: row.points,
      refType: row.ref_type,
      refKey: row.ref_key,
      weightGrams: Number(row.weight_grams),
      expiresAt: row.expires_at,
    })
  }

  for (const row of redeems) {
    entries.push({
      id: row.redeem_id,
      kind: 'redeem',
      date: row.created_at,
      points: row.points,
      keterangan: row.keterangan,
      createdByNama: row.created_by_nama,
    })
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries
}
