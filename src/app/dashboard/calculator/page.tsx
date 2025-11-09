'use client'

import { useState } from 'react'
import { Calculator, Info } from 'lucide-react'
import { GOLD_STANDARDS, calculateGoldPurity, formatWeight } from '@/lib/utils'

interface PurityResult {
  goldWeight: number
  copperWeight: number
  silverWeight: number
  totalWeight: number
}

export default function CalculatorPage() {
  const [calculatorType, setCalculatorType] = useState<'purity' | 'mix'>('purity')
  
  // Purity Calculator States
  const [purityInputs, setPurityInputs] = useState({
    weight: '',
    currentKarat: '18',
    desiredKarat: '24'
  })
  const [purityResult, setPurityResult] = useState<PurityResult | null>(null)

  // Mix Calculator States
  const [mixInputs, setMixInputs] = useState({
    gold: '',
    copper: '',
    silver: '',
    platinum: '',
    paladium: ''
  })
  const [mixResult, setMixResult] = useState<number | null>(null)

  const handlePurityCalculate = () => {
    try {
      const result = calculateGoldPurity(
        parseFloat(purityInputs.weight),
        parseInt(purityInputs.currentKarat),
        parseInt(purityInputs.desiredKarat)
      )
      setPurityResult(result)
    } catch {
      alert('Gagal menghitung. Periksa kembali input Anda.')
    }
  }

  const handleMixCalculate = () => {
    try {
      const goldPercentage = parseFloat(mixInputs.gold) || 0
      const totalPercentage = 
        goldPercentage + 
        (parseFloat(mixInputs.copper) || 0) +
        (parseFloat(mixInputs.silver) || 0) +
        (parseFloat(mixInputs.platinum) || 0) +
        (parseFloat(mixInputs.paladium) || 0)

      if (Math.abs(totalPercentage - 100) > 0.1) {
        alert('Total campuran harus 100%')
        return
      }

      // Find closest karat
      let closestKarat = GOLD_STANDARDS[0]
      let minDiff = Math.abs(GOLD_STANDARDS[0].percentage - goldPercentage)
      
      for (const standard of GOLD_STANDARDS) {
        const diff = Math.abs(standard.percentage - goldPercentage)
        if (diff < minDiff) {
          minDiff = diff
          closestKarat = standard
        }
      }

      setMixResult(closestKarat.karat)
    } catch {
      alert('Gagal menghitung. Periksa kembali input Anda.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kalkulator Emas</h1>
        <p className="text-gray-600">Hitung kadar dan campuran emas berdasarkan SNI 13-3487-2005</p>
      </div>

      {/* Calculator Type Selector */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setCalculatorType('purity')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              calculatorType === 'purity'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hitung Kadar Emas
          </button>
          <button
            onClick={() => setCalculatorType('mix')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              calculatorType === 'mix'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ubah Kadar Emas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {calculatorType === 'purity' ? 'Hitung Kadar Emas' : 'Ubah Kadar Emas'}
            </h2>
          </div>

          {calculatorType === 'purity' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Berat Emas Murni (gram)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purityInputs.weight}
                  onChange={(e) => setPurityInputs(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kadar yang Diinginkan
                </label>
                <select
                  value={purityInputs.desiredKarat}
                  onChange={(e) => setPurityInputs(prev => ({ ...prev, desiredKarat: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                >
                  {GOLD_STANDARDS.map(standard => (
                    <option key={standard.karat} value={standard.karat}>
                      {standard.karat} Karat ({standard.percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handlePurityCalculate}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
              >
                Hitung
              </button>

              {purityResult && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <h3 className="font-semibold text-amber-900 mb-3">Hasil Perhitungan:</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Berat Emas Murni:</span>{' '}
                      {formatWeight(purityResult.goldWeight)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Berat Tembaga:</span>{' '}
                      {formatWeight(purityResult.copperWeight)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Berat Perak:</span>{' '}
                      {formatWeight(purityResult.silverWeight)}
                    </p>
                    <p className="text-amber-900 font-semibold text-base pt-2 border-t border-amber-300">
                      <span>Total Berat:</span>{' '}
                      {formatWeight(purityResult.totalWeight)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emas (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={mixInputs.gold}
                  onChange={(e) => setMixInputs(prev => ({ ...prev, gold: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perak (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={mixInputs.silver}
                  onChange={(e) => setMixInputs(prev => ({ ...prev, silver: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tembaga (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={mixInputs.copper}
                  onChange={(e) => setMixInputs(prev => ({ ...prev, copper: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platina (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={mixInputs.platinum}
                  onChange={(e) => setMixInputs(prev => ({ ...prev, platinum: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paladium (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={mixInputs.paladium}
                  onChange={(e) => setMixInputs(prev => ({ ...prev, paladium: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                  placeholder="0.0"
                />
              </div>

              <button
                onClick={handleMixCalculate}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
              >
                Hitung Kadar
              </button>

              {mixResult !== null && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-900 mb-2">Hasil:</h3>
                  <p className="text-2xl font-bold text-amber-600">{mixResult} Karat</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gold Standards Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Standar Kadar Emas (SNI)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Karat</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Persentase</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">SNI Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {GOLD_STANDARDS.map((standard) => (
                  <tr key={standard.karat} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{standard.karat}K</td>
                    <td className="px-4 py-3 text-gray-900">{standard.percentage}%</td>
                    <td className="px-4 py-3 text-gray-900">
                      {standard.sniMin > 0 
                        ? `${standard.sniMin}% - ${standard.sniMax}%`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Catatan:</h3>
            <p className="text-xs text-blue-800">
              Standar kadar emas berdasarkan SNI (Standar Nasional Indonesia) 13-3487-2005.
              1 Karat = 4.2% emas murni (24K = 100% emas murni).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
