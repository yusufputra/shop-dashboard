'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { generateSerialNumber } from '@/lib/utils'

export default function NewInventoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [goldPrice, setGoldPrice] = useState<number | null>(null)
  const [loadingGold, setLoadingGold] = useState(false)
  const [useGoldPrice, setUseGoldPrice] = useState(true)
  const [manualGoldPrice, setManualGoldPrice] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [formData, setFormData] = useState({
    seri: generateSerialNumber('STK'),
    tanggal: new Date().toISOString().split('T')[0],
    jenis: '',
    perhiasan: '',
    model: '',
    berat: '',
    harga: '',
    keterangan: ''
  })

  useEffect(() => {
    // fetch the server-side proxy that attempts to get Antam price
    const fetchGold = async () => {
      setLoadingGold(true)
      try {
        const res = await fetch('/api/gold-price')
        const data = await res.json()
        if (data && data.pricePerGram) {
          setGoldPrice(Number(data.pricePerGram))
        } else {
          setGoldPrice(null)
        }
      } catch (err) {
        console.error('Failed to fetch gold price', err)
        setGoldPrice(null)
      } finally {
        setLoadingGold(false)
      }
    }

    fetchGold()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('stok_perhiasan')
        .insert([{
          seri: formData.seri,
          tanggal: formData.tanggal,
          jenis: formData.jenis,
          perhiasan: formData.perhiasan,
          model: formData.model,
          berat: parseFloat(formData.berat),
          harga: parseFloat(formData.harga),
          keterangan: formData.keterangan || null
        }])

      if (error) throw error

      router.push('/dashboard/inventory')
    } catch (error) {
      console.error('Error adding inventory:', error)
      alert('Gagal menambahkan data stok')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData(prev => {
      const next = { ...prev, [name]: value }

      // If berat changes and we use gold price, auto-calc harga
      if (name === 'berat' && useGoldPrice && goldPrice) {
        const beratNum = parseFloat(String(value))
        if (!isNaN(beratNum)) {
          // round to nearest integer IDR
          next.harga = String(Math.round(beratNum * goldPrice))
        }
      }

      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/inventory"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Stok Perhiasan</h1>
          <p className="text-gray-600">Input data stok perhiasan baru</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Seri <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="seri"
              value={formData.seri}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis <span className="text-red-500">*</span>
            </label>
            <select
              name="jenis"
              value={formData.jenis}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Jenis</option>
              <option value="Emas Kuning 18K">Emas Kuning 18K</option>
              <option value="Emas Kuning 14K">Emas Kuning 14K</option>
              <option value="Emas Merah 18K">Emas Merah 18K</option>
              <option value="Emas Putih 18K">Emas Putih 18K</option>
              <option value="Perak">Perak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perhiasan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="perhiasan"
              value={formData.perhiasan}
              onChange={handleChange}
              required
              placeholder="Contoh: Cincin, Kalung, Gelang"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              placeholder="Contoh: Klasik, Modern, Etnik"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berat (gram) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              name="berat"
              value={formData.berat}
              onChange={handleChange}
              required
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="harga"
                value={formData.harga}
                onChange={(e) => {
                  // if user edits harga manually, disable auto calc
                  setUseGoldPrice(false)
                  const target = e.target as HTMLInputElement
                  const { name, value } = target
                  setFormData(prev => ({ ...prev, [name]: value }))
                }}
                required
                placeholder="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />

              <button
                type="button"
                onClick={async () => {
                  setUseGoldPrice(v => !v)
                  // if enabling and we have goldPrice and berat, compute right away
                  if (!useGoldPrice && goldPrice) {
                    const beratNum = parseFloat(String(formData.berat))
                    if (!isNaN(beratNum)) {
                      setFormData(prev => ({ ...prev, harga: String(Math.round(beratNum * goldPrice)) }))
                    }
                  }
                }}
                className={`px-3 py-2 border rounded-lg text-sm ${useGoldPrice ? 'bg-amber-500 text-white border-amber-500' : 'text-gray-700 bg-white'}`}
                title={useGoldPrice ? 'Auto calculate from current gold price' : 'Manual harga'}
              >
                {useGoldPrice ? 'Auto' : 'Manual'}
              </button>
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {loadingGold ? (
                  <span>Memuat harga emas...</span>
                ) : goldPrice ? (
                  <span>Harga acuan Pluang: Rp {new Intl.NumberFormat('id-ID').format(goldPrice)} / gram</span>
                ) : (
                  <span>Tidak dapat mengambil harga Antam otomatis</span>
                )}
                {!goldPrice && !loadingGold && (
                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-amber-600 hover:text-amber-700 underline text-xs"
                  >
                    {showManualInput ? 'Sembunyikan' : 'Input manual'}
                  </button>
                )}
              </div>

              {showManualInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualGoldPrice}
                    onChange={(e) => setManualGoldPrice(e.target.value)}
                    placeholder="Harga emas per gram (Rp)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const price = parseFloat(manualGoldPrice)
                      if (!isNaN(price) && price > 0) {
                        setGoldPrice(price)
                        setShowManualInput(false)
                        setUseGoldPrice(true)
                        // auto-calc if berat exists
                        const beratNum = parseFloat(String(formData.berat))
                        if (!isNaN(beratNum)) {
                          setFormData(prev => ({ ...prev, harga: String(Math.round(beratNum * price)) }))
                        }
                      }
                    }}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={3}
              placeholder="Keterangan tambahan (opsional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Data</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/inventory"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
