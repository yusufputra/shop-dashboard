'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { PesananPerhiasan } from '@/types/database'

export default function EditOrderPage({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<PesananPerhiasan>>({
    nama: '',
    alamat: '',
    no_telp: '',
    bahan_perhiasan: '',
    jenis_perhiasan: '',
    model: '',
    berat: 0,
    dp_pembayaran: 0,
    harga: 0,
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: ''
  })

  useEffect(() => {
    async function loadOrder() {
      try {
        const { data, error } = await supabase
          .from('pesanan_perhiasan')
          .select('*')
          .eq('no', no)
          .single()

        if (error) throw error
        
        setFormData({
          ...data,
          tanggal: new Date(data.tanggal).toISOString().split('T')[0]
        })
      } catch (error) {
        console.error('Error loading order:', error)
        alert('Gagal memuat data')
        router.push('/dashboard/orders')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [no, supabase, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('pesanan_perhiasan')
        .update({
          nama: formData.nama,
          alamat: formData.alamat,
          no_telp: formData.no_telp,
          bahan_perhiasan: formData.bahan_perhiasan,
          jenis_perhiasan: formData.jenis_perhiasan,
          model: formData.model,
          berat: formData.berat,
          dp_pembayaran: formData.dp_pembayaran,
          harga: formData.harga,
          tanggal: formData.tanggal,
          keterangan: formData.keterangan || null
        })
        .eq('no', no)

      if (error) throw error

      router.push(`/dashboard/orders/${no}`)
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Gagal mengupdate data')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/orders/${no}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Pesanan</h1>
          <p className="text-gray-600">{no}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pesanan
            </label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pelanggan
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="Nama pelanggan"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat
            </label>
            <textarea
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="Alamat lengkap pelanggan"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Telepon
            </label>
            <input
              type="tel"
              value={formData.no_telp}
              onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bahan Perhiasan
            </label>
            <input
              type="text"
              value={formData.bahan_perhiasan}
              onChange={(e) => setFormData({ ...formData, bahan_perhiasan: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="e.g. Emas 24K"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Perhiasan
            </label>
            <select
              value={formData.jenis_perhiasan}
              onChange={(e) => setFormData({ ...formData, jenis_perhiasan: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              required
            >
              <option value="">Pilih Jenis</option>
              <option value="gelang">Gelang</option>
              <option value="kalung">Kalung</option>
              <option value="cincin">Cincin</option>
              <option value="anting">Anting</option>
              <option value="liontin">Liontin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="Model pesanan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berat (gram)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.berat}
              onChange={(e) => setFormData({ ...formData, berat: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Harga (Rp)
            </label>
            <input
              type="number"
              value={formData.harga}
              onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DP Pembayaran (Rp)
            </label>
            <input
              type="number"
              value={formData.dp_pembayaran}
              onChange={(e) => setFormData({ ...formData, dp_pembayaran: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="0"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan (Opsional)
            </label>
            <textarea
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
              placeholder="Catatan tambahan"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
          <Link
            href={`/dashboard/orders/${no}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
