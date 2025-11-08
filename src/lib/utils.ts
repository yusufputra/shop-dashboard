import { GoldStandard } from '@/types/database'

// Based on SNI 13-3487-2005
export const GOLD_STANDARDS: GoldStandard[] = [
  { karat: 24, percentage: 99.99, sniMin: 99.00, sniMax: 99.99 },
  { karat: 23, percentage: 95.8, sniMin: 94.80, sniMax: 98.89 },
  { karat: 22, percentage: 91.6, sniMin: 90.60, sniMax: 94.79 },
  { karat: 21, percentage: 87.5, sniMin: 86.50, sniMax: 90.59 },
  { karat: 20, percentage: 83.3, sniMin: 82.30, sniMax: 86.49 },
  { karat: 19, percentage: 79.1, sniMin: 78.20, sniMax: 82.29 },
  { karat: 18, percentage: 75.0, sniMin: 75.40, sniMax: 78.19 },
  { karat: 17, percentage: 70.8, sniMin: 0, sniMax: 0 },
  { karat: 16, percentage: 66.6, sniMin: 0, sniMax: 0 },
  { karat: 15, percentage: 62.5, sniMin: 0, sniMax: 0 },
  { karat: 14, percentage: 58.5, sniMin: 0, sniMax: 0 },
  { karat: 10, percentage: 41.7, sniMin: 0, sniMax: 0 },
  { karat: 9, percentage: 37.5, sniMin: 0, sniMax: 0 },
  { karat: 8, percentage: 33.3, sniMin: 0, sniMax: 0 },
]

export interface MixCalculation {
  goldWeight: number
  copperWeight: number
  silverWeight: number
  totalWeight: number
}

export function calculateGoldPurity(
  weight: number,
  currentKarat: number,
  desiredKarat: number
): MixCalculation {
  const current = GOLD_STANDARDS.find(s => s.karat === currentKarat)
  const desired = GOLD_STANDARDS.find(s => s.karat === desiredKarat)
  
  if (!current || !desired) {
    throw new Error('Invalid karat value')
  }

  const pureGold = (weight * current.percentage) / 100
  const totalWeight = (pureGold * 100) / desired.percentage
  const additionalWeight = totalWeight - weight

  return {
    goldWeight: pureGold,
    copperWeight: additionalWeight * 0.5,
    silverWeight: additionalWeight * 0.5,
    totalWeight: totalWeight
  }
}

export function calculateWeightByMix(
  goldPercentage: number,
  copperPercentage: number,
  silverPercentage: number,
  _platinumPercentage: number = 0,
  _paladiumPercentage: number = 0
): number {
  // Find closest karat based on gold percentage
  let closestKarat = GOLD_STANDARDS[0]
  let minDiff = Math.abs(GOLD_STANDARDS[0].percentage - goldPercentage)
  
  for (const standard of GOLD_STANDARDS) {
    const diff = Math.abs(standard.percentage - goldPercentage)
    if (diff < minDiff) {
      minDiff = diff
      closestKarat = standard
    }
  }
  
  return closestKarat.karat
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} gram`
}

export function generateSerialNumber(prefix: string = 'SRV'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
