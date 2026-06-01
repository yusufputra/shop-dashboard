/** Opsi jenis perhiasan di form stok & pembelian */
export const PERHIASAN_OPTIONS = [
  'Kalung',
  'Gelang',
  'Cincin',
  'Anting',
  'Liontin',
  'Giwang',
] as const

export type PerhiasanOption = (typeof PERHIASAN_OPTIONS)[number]

/** Samakan nilai lama (mis. lowercase) ke opsi standar untuk select */
export function normalizePerhiasanForSelect(value: string): string {
  const t = value.trim()
  if (!t) return t
  const match = PERHIASAN_OPTIONS.find((p) => p.toLowerCase() === t.toLowerCase())
  return match ?? t
}
