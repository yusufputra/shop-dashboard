import type { SupabaseClient } from '@supabase/supabase-js'

export type CustomerLookupRow = {
  customer_id: string
  nama: string
  phone: string | null
}

export async function fetchCustomerByPublicId(
  supabase: SupabaseClient,
  raw: string
): Promise<CustomerLookupRow | null> {
  const public_id = raw.trim()
  if (!public_id) return null
  const { data } = await supabase
    .from('customers')
    .select('customer_id, nama, phone')
    .eq('public_id', public_id)
    .maybeSingle()
  if (!data) return null
  return {
    customer_id: data.customer_id,
    nama: data.nama,
    phone: data.phone ?? null,
  }
}

export async function resolveCustomerIdByPublicId(
  supabase: SupabaseClient,
  raw: string
): Promise<string | null> {
  const row = await fetchCustomerByPublicId(supabase, raw)
  return row?.customer_id ?? null
}

export function pointsForSaleWeight(beratGrams: number): number {
  if (!Number.isFinite(beratGrams) || beratGrams <= 0) return 0
  return beratGrams
}

export function defaultPointExpiryIso(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}
