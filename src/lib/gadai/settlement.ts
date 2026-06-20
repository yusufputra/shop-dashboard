/** Total pelunasan = pokok pinjaman + bunga */
export function computeTotalPelunasan(uangDipinjam: number, bunga: number): number {
  const pokok = Number.isFinite(uangDipinjam) ? uangDipinjam : 0
  const interest = Number.isFinite(bunga) ? bunga : 0
  return pokok + interest
}

export function parseMoneyInput(value: string): number {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export function formatTotalPelunasanInput(uangDipinjam: string, bunga: string): string {
  const total = computeTotalPelunasan(parseMoneyInput(uangDipinjam), parseMoneyInput(bunga))
  return total > 0 ? String(total) : ''
}
