/** Normalisasi ID dari input form atau segmen URL */
export function normalizePublicIdInput(raw: string): string {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

/** Untuk href ke halaman detail pelanggan */
export function customerPublicIdPath(publicId: string): string {
  return encodeURIComponent(publicId.trim())
}
