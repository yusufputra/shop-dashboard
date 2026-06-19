/** Encode no invoice untuk segment URL Next.js */
export function gadaiInvoicePath(noInvoice: string): string {
  return encodeURIComponent(noInvoice)
}

export function decodeGadaiInvoiceParam(raw: string): string {
  return decodeURIComponent(raw)
}
