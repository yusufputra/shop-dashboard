import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

/**
 * Server-side proxy to fetch current gold price from harga-emas.org.
 * Scrapes the 1 gram gold price page.
 * 
 * Returns { pricePerGram: number | null, source: string, ok: boolean }
 */
export async function GET() {
  try {
    const res = await fetch('https://harga-emas.org/1-gram', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      next: { revalidate: 300 } // cache for 5 minutes
    })

    console.log('Fetched harga-emas.org/1-gram, status:', res.status)

    if (!res.ok) {
      console.error('harga-emas.org failed:', res.status)
      return NextResponse.json({ 
        pricePerGram: null, 
        source: 'harga-emas.org', 
        ok: false,
        status: res.status 
      }, { status: 200 })
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    let pricePerGram: number | null = null

    // Strategy 1: Look for elements with price data
    // Common patterns: look for large numbers in price-related elements
    $('.harga, .price, [class*="harga"], [class*="price"]').each((_, el) => {
      if (pricePerGram) return
      
      const text = $(el).text().trim()
      const priceMatch = text.match(/(?:Rp\.?\s*)?([0-9][0-9\.,]{3,})/i)
      
      if (priceMatch && priceMatch[1]) {
        const raw = priceMatch[1].trim()
        const normalized = raw.replace(/\./g, '').replace(/,/g, '.')
        const value = parseFloat(normalized)
        
        if (!isNaN(value) && value > 100000) { // 1 gram gold should be > 100k IDR
          pricePerGram = value
        }
      }
    })

    // Strategy 2: Look in tables for "Jual" or "Sell" price
    if (!pricePerGram) {
      $('table tr').each((_, row) => {
        if (pricePerGram) return
        
        const rowText = $(row).text().toLowerCase()
        
        // Look for rows with "jual", "sell", or "harga"
        if (rowText.includes('jual') || rowText.includes('sell') || rowText.includes('harga')) {
          $(row).find('td').each((_, cell) => {
            const text = $(cell).text().trim()
            const priceMatch = text.match(/(?:Rp\.?\s*)?([0-9][0-9\.,]{3,})/i)
            
            if (priceMatch && priceMatch[1]) {
              const raw = priceMatch[1].trim()
              const normalized = raw.replace(/\./g, '').replace(/,/g, '.')
              const value = parseFloat(normalized)
              
              if (!isNaN(value) && value > 100000) {
                pricePerGram = value
              }
            }
          })
        }
      })
    }

    // Strategy 3: Find any large number that looks like a price
    if (!pricePerGram) {
      const bodyText = $('body').text()
      const matches = bodyText.matchAll(/Rp\.?\s*([0-9][0-9\.,]{6,})/gi)
      
      for (const match of matches) {
        if (match[1]) {
          const raw = match[1].trim()
          const normalized = raw.replace(/\./g, '').replace(/,/g, '.')
          const value = parseFloat(normalized)
          
          // Look for prices in reasonable range for 1 gram gold (100k - 5M IDR)
          if (!isNaN(value) && value > 100000 && value < 5000000) {
            pricePerGram = value
            break
          }
        }
      }
    }

    console.log('Extracted gold price per gram:', pricePerGram)

    if (pricePerGram) {
      return NextResponse.json({ 
        pricePerGram, 
        source: 'harga-emas.org', 
        ok: true 
      })
    }

    return NextResponse.json({ 
      pricePerGram: null, 
      source: 'harga-emas.org', 
      ok: false 
    })
  } catch (err) {
    console.error('Error fetching gold price:', err)
    return NextResponse.json({ 
      pricePerGram: null, 
      source: 'error', 
      ok: false, 
      error: String(err) 
    }, { status: 200 })
  }
}
