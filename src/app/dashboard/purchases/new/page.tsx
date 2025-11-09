'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { generateSerialNumber } from '@/lib/utils'

export default function NewPurchasePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [goldPrice, setGoldPrice] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    seri: generateSerialNumber('BUY'),
    tanggal: new Date().toISOString().split('T')[0],
    nama: '',
    alamat: '',
    jenis: '',
    perhiasan: '',
    model: '',
    berat: '',
    harga: '',
    keterangan: ''
  })

  const fetchGoldPrice = async () => {
    setLoadingPrice(true)
    try {
      const response = await fetch('/api/gold-price')
      const data = await response.json()
      if (data.price) {
        setGoldPrice(data.price)
      }
    } catch (error) {
      console.error('Error fetching gold price:', error)
    } finally {
      setLoadingPrice(false)
    }
  }

  useEffect(() => {
    fetchGoldPrice()
  }, [])

  const calculatePrice = () => {
    if (goldPrice && formData.berat) {
      const weight = parseFloat(formData.berat)
      if (!isNaN(weight)) {
        const calculatedPrice = weight * goldPrice
        setFormData(prev => ({ ...prev, harga: calculatedPrice.toString() }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('pembelian_perhiasan')
        .insert([{
          ...formData,
          berat: parseFloat(formData.berat),
          harga: parseFloat(formData.harga),
          keterangan: formData.keterangan || null
        }])

      if (error) throw error
      router.push('/dashboard/purchases')
    } catch (error) {
      console.error('Error adding purchase:', error)
      alert('Gagal menambahkan data pembelian')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beli Emas dari Pelanggan</h1>
          <p className="text-gray-600">Catat pembelian emas dari pelanggan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {goldPrice && (
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Harga Emas Hari Ini</p>
              <p className="text-2xl font-bold">Rp {goldPrice.toLocaleString('id-ID')}/gram</p>
            </div>
            <button
              type="button"
              onClick={fetchGoldPrice}
              disabled={loadingPrice}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              {loadingPrice ? '...' : 'Refresh'}
            </button>
          </div>
        )}
        
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Penjual <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              placeholder="Nama pelanggan yang menjual emas"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Beli (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="harga"
                value={formData.harga}
                onChange={handleChange}
                required
                placeholder="Harga yang Anda bayar"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              />
              {goldPrice && (
                <button
                  type="button"
                  onClick={calculatePrice}
                  className="px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all flex items-center gap-2"
                  title="Auto-calculate based on weight and current gold price"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Hitung</span>
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md disabled:opacity-50"
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
          <Link href="/dashboard/purchases" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
