'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { generateSerialNumber } from '@/lib/utils'

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    no: generateSerialNumber('ORD'),
    tanggal: new Date().toISOString().split('T')[0],
    nama: '',
    alamat: '',
    no_telp: '',
    bahan_perhiasan: '',
    jenis_perhiasan: '',
    model: '',
    berat: '',
    dp_pembayaran: '',
    harga: '',
    keterangan: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('pesanan_perhiasan')
        .insert([{
          ...formData,
          berat: parseFloat(formData.berat),
          dp_pembayaran: parseFloat(formData.dp_pembayaran),
          harga: parseFloat(formData.harga),
          keterangan: formData.keterangan || null
        }])

      if (error) throw error
      router.push('/dashboard/orders')
    } catch (error) {
      console.error('Error adding order:', error)
      alert('Gagal menambahkan pesanan')
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
        <Link href="/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pesanan</h1>
          <p className="text-gray-600">Input data pesanan custom perhiasan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Pesanan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="no"
              value={formData.no}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="no_telp"
              value={formData.no_telp}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bahan Perhiasan <span className="text-red-500">*</span>
            </label>
            <select
              name="bahan_perhiasan"
              value={formData.bahan_perhiasan}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Bahan</option>
              <option value="Emas Kuning 18K">Emas Kuning 18K</option>
              <option value="Emas Kuning 14K">Emas Kuning 14K</option>
              <option value="Emas Merah 18K">Emas Merah 18K</option>
              <option value="Emas Putih 18K">Emas Putih 18K</option>
              <option value="Perak">Perak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Perhiasan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="jenis_perhiasan"
              value={formData.jenis_perhiasan}
              onChange={handleChange}
              required
              placeholder="Cincin, Kalung, Gelang, dll"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DP Pembayaran (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="dp_pembayaran"
              value={formData.dp_pembayaran}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Total (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="harga"
              value={formData.harga}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Pesanan</span>
              </>
            )}
          </button>
          <Link href="/dashboard/orders" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
