/** Opsi warna emas di form stok */
export const WARNA_OPTIONS = [
  { value: 'kuning', label: 'Kuning' },
  { value: 'rosegold', label: 'Rosegold' },
  { value: 'putih', label: 'Putih' },
  { value: 'variasi', label: 'Variasi' },
  { value: 'hitam', label: 'Hitam' },
  { value: 'merah', label: 'Merah' },
] as const

export type WarnaValue = (typeof WARNA_OPTIONS)[number]['value']

export function normalizeWarnaForSelect(value: string): string {
  const t = value.trim()
  if (!t) return t
  const match = WARNA_OPTIONS.find((w) => w.value.toLowerCase() === t.toLowerCase())
  return match?.value ?? t
}

export function warnaLabel(value: string): string {
  const match = WARNA_OPTIONS.find((w) => w.value === value)
  return match?.label ?? value.charAt(0).toUpperCase() + value.slice(1)
}
