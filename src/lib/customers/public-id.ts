/** ID publik 10 digit (string, angka acak 1e9..1e10-1) */
export function generateCustomerPublicId(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000))
}

export function normalizePublicIdInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10)
}
