import type { StokPerhiasan } from '@/types/database'

export const TIPE_GELANG_OPTIONS = [
  { value: 'rantai', label: 'Rantai' },
  { value: 'beagle', label: 'Beagle' },
] as const

export const LOGAM_MULIA = 'Logam Mulia (LM)'

export type InventoryDimensionForm = {
  perhiasan: string
  kode_pabrik: string
  kode_produksi: string
  ring_cm: string
  panjang_cm: string
  tipe_gelang: string
  diameter_cm: string
}

export const EMPTY_INVENTORY_DIMENSIONS = {
  kode_pabrik: '',
  kode_produksi: '',
  ring_cm: '',
  panjang_cm: '',
  tipe_gelang: '',
  diameter_cm: '',
}

export function clearDimensionsOnPerhiasanChange(perhiasan: string) {
  return {
    perhiasan,
    kode_produksi: '',
    ring_cm: '',
    panjang_cm: '',
    tipe_gelang: '',
    diameter_cm: '',
  }
}

export function clearDimensionsOnTipeGelangChange(tipe_gelang: string) {
  return {
    tipe_gelang,
    panjang_cm: '',
    diameter_cm: '',
  }
}

function parseCm(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

export function validateInventoryDimensions(form: InventoryDimensionForm): string | null {
  const p = form.perhiasan
  if (p === 'Cincin') {
    if (!form.ring_cm.trim()) return 'Ring (cm) wajib diisi untuk cincin.'
    if (parseCm(form.ring_cm) == null) return 'Ring harus berupa angka.'
  }
  if (p === 'Kalung') {
    if (!form.panjang_cm.trim()) return 'Panjang (cm) wajib diisi untuk kalung.'
    if (parseCm(form.panjang_cm) == null) return 'Panjang harus berupa angka.'
  }
  if (p === 'Gelang') {
    if (!form.tipe_gelang) return 'Tipe gelang wajib dipilih.'
    if (form.tipe_gelang === 'rantai') {
      if (!form.panjang_cm.trim()) return 'Panjang (cm) wajib diisi untuk gelang rantai.'
      if (parseCm(form.panjang_cm) == null) return 'Panjang harus berupa angka.'
    }
    if (form.tipe_gelang === 'beagle') {
      if (!form.diameter_cm.trim()) return 'Diameter (cm) wajib diisi untuk gelang beagle.'
      if (parseCm(form.diameter_cm) == null) return 'Diameter harus berupa angka.'
    }
  }
  return null
}

export function buildInventoryDimensionPayload(form: InventoryDimensionForm) {
  const base = {
    kode_pabrik: form.kode_pabrik.trim() || null,
    kode_produksi: form.perhiasan === LOGAM_MULIA ? form.kode_produksi.trim() || null : null,
    ring_cm: null as number | null,
    panjang_cm: null as number | null,
    tipe_gelang: null as string | null,
    diameter_cm: null as number | null,
  }

  if (form.perhiasan === 'Cincin') {
    base.ring_cm = parseCm(form.ring_cm)
    return base
  }
  if (form.perhiasan === 'Kalung') {
    base.panjang_cm = parseCm(form.panjang_cm)
    return base
  }
  if (form.perhiasan === 'Gelang') {
    base.tipe_gelang = form.tipe_gelang || null
    if (form.tipe_gelang === 'rantai') {
      base.panjang_cm = parseCm(form.panjang_cm)
    } else if (form.tipe_gelang === 'beagle') {
      base.diameter_cm = parseCm(form.diameter_cm)
    }
    return base
  }

  return base
}

export function inventoryDimensionsFromRow(item: StokPerhiasan): InventoryDimensionForm {
  return {
    perhiasan: item.perhiasan,
    kode_pabrik: item.kode_pabrik ?? '',
    kode_produksi: item.kode_produksi ?? '',
    ring_cm: item.ring_cm != null ? String(item.ring_cm) : '',
    panjang_cm: item.panjang_cm != null ? String(item.panjang_cm) : '',
    tipe_gelang: item.tipe_gelang ?? '',
    diameter_cm: item.diameter_cm != null ? String(item.diameter_cm) : '',
  }
}

export type InventoryDetailLine = { label: string; value: string }

export function inventoryDimensionDetailLines(item: StokPerhiasan): InventoryDetailLine[] {
  const lines: InventoryDetailLine[] = []
  if (item.kode_pabrik?.trim()) {
    lines.push({ label: 'Kode pabrik', value: item.kode_pabrik.trim() })
  }
  if (item.perhiasan === LOGAM_MULIA && item.kode_produksi?.trim()) {
    lines.push({ label: 'Kode produksi', value: item.kode_produksi.trim() })
  }
  if (item.perhiasan === 'Cincin' && item.ring_cm != null) {
    lines.push({ label: 'Ring', value: `${item.ring_cm} cm` })
  }
  if (item.perhiasan === 'Kalung' && item.panjang_cm != null) {
    lines.push({ label: 'Panjang', value: `${item.panjang_cm} cm` })
  }
  if (item.perhiasan === 'Gelang') {
    if (item.tipe_gelang) {
      const tipeLabel =
        TIPE_GELANG_OPTIONS.find((t) => t.value === item.tipe_gelang)?.label ?? item.tipe_gelang
      lines.push({ label: 'Tipe gelang', value: tipeLabel })
    }
    if (item.tipe_gelang === 'rantai' && item.panjang_cm != null) {
      lines.push({ label: 'Panjang', value: `${item.panjang_cm} cm` })
    }
    if (item.tipe_gelang === 'beagle' && item.diameter_cm != null) {
      lines.push({ label: 'Diameter', value: `${item.diameter_cm} cm` })
    }
  }
  return lines
}
