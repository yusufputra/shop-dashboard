import JsBarcode from 'jsbarcode'
import type { Customer } from '@/types/database'

const CARD_LOGO_PATH = '/images/logo-white.png'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/**
 * Generates a wallet-style loyalty card PNG and triggers browser download.
 * Barcode encodes `displayId` (10 digit) for scanning at checkout.
 */
export async function downloadCustomerCardPng(customer: Customer, displayId: string) {
  const logoSrc =
    typeof window !== 'undefined'
      ? new URL(CARD_LOGO_PATH, window.location.origin).href
      : CARD_LOGO_PATH
  const logo = await loadImage(logoSrc)

  const w = 880
  const h = 520
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#b45309')
  g.addColorStop(0.45, '#d97706')
  g.addColorStop(1, '#facc15')
  ctx.fillStyle = g
  drawRoundedRect(ctx, 0, 0, w, h, 28)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 3
  drawRoundedRect(ctx, 12, 12, w - 24, h - 24, 22)
  ctx.stroke()

  if (logo && logo.naturalWidth > 0) {
    const targetW = 200
    const targetH = (logo.naturalHeight / logo.naturalWidth) * targetW
    const lx = w - targetW - 40
    const ly = 28
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(logo, lx, ly, targetW, targetH)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '600 26px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText('KARTU PELANGGAN', 44, 58)

  ctx.font = '500 18px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText('KAIROS — tunjukkan ID ini saat berbelanja', 44, 92)

  ctx.fillStyle = '#fff'
  ctx.font = '700 42px system-ui, -apple-system, Segoe UI, sans-serif'
  const nama = customer.nama.length > 28 ? `${customer.nama.slice(0, 27)}…` : customer.nama
  ctx.fillText(nama, 44, 168)

  ctx.font = '500 22px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(`ID: ${displayId}`, 44, 218)

  const tel = customer.phone?.trim() ? customer.phone : '—'
  const em = customer.email?.trim() ? customer.email : '—'
  ctx.font = '500 19px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.fillText(`Tel: ${tel}`, 44, 268)
  ctx.fillText(`Email: ${em.length > 36 ? `${em.slice(0, 35)}…` : em}`, 44, 302)

  const panelTop = 318
  const panelH = 192
  const panelPad = 16
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  drawRoundedRect(ctx, 44, panelTop, w - 88, panelH, 18)
  ctx.fill()

  const innerX = 44 + panelPad
  const innerY = panelTop + panelPad
  const innerW = w - 88 - panelPad * 2
  const innerH = 125
  ctx.fillStyle = '#fff'
  drawRoundedRect(ctx, innerX, innerY, innerW, innerH, 10)
  ctx.fill()

  const bcCanvas = document.createElement('canvas')
  try {
    JsBarcode(bcCanvas, displayId, {
      format: 'CODE128',
      width: 2,
      height: 62,
      displayValue: true,
      fontSize: 18,
      textMargin: 6,
      margin: 10,
      background: '#ffffff',
      lineColor: '#111111',
    })
  } catch (e) {
    console.error(e)
    return
  }

  const maxBw = innerW - 20
  const maxBh = innerH - 16
  const scale = Math.min(maxBw / bcCanvas.width, maxBh / bcCanvas.height)
  const dw = bcCanvas.width * scale
  const dh = bcCanvas.height * scale
  const bx = innerX + (innerW - dw) / 2
  const by = innerY + (innerH - dh) / 2
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(bcCanvas, bx, by, dw, dh)

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '500 15px system-ui, -apple-system, Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    '1 poin per gram pembelian · berlaku 1 tahun per transaksi',
    w / 2,
    panelTop + panelH - 16
  )
  ctx.textAlign = 'left'

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kartu-pelanggan-${displayId}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
