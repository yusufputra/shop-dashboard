'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { PembelianPerhiasan } from '@/types/database'

export default function EditPurchasePage({ params }: { params: Promise<{ seri: string }> }) {
  const { seri } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<PembelianPerhiasan>>({
    nama: '',
    alamat: '',
    jenis: '',
    perhiasan: '',
    model: '',
    berat: 0,
    harga: 0,
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: ''
  })

  useEffect(() => {
    async function loadPurchase() {
      try {
        const { data, error } = await supabase
          .from('pembelian_perhiasan')
          .select('*')
          .eq('seri', seri)
          .single()

        if (error) throw error
        
        setFormData({
          ...data,
          tanggal: new Date(data.tanggal).toISOString().split('T')[0]
        })
      } catch (error) {
        console.error('Error loading purchase:', error)
        alert('Gagal memuat data')
        router.push('/dashboard/purchases')
      } finally {
        setLoading(false)
      }
    }

    loadPurchase()
  }, [seri, supabase, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('pembelian_perhiasan')
        .update({
          nama: formData.nama,
          alamat: formData.alamat,
          jenis: formData.jenis,
          perhiasan: formData.perhiasan,
          model: formData.model,
          berat: formData.berat,
          harga: formData.harga,
          tanggal: formData.tanggal,
          keterangan: formData.keterangan || null
        })
        .eq('seri', seri)

      if (error) throw error

      router.push(`/dashboard/purchases/${seri}`)
    } catch (error) {
      console.error('Error updating purchase:', error)
      alert('Gagal mengupdate data')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/purchases/${seri}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Pembelian Perhiasan</h1>
          <p className="text-gray-600">{seri}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pembelian
            </label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Penjual
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              placeholder="Nama penjual"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              placeholder="Alamat lengkap penjual"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis
            </label>
            <select
              value={formData.jenis}
              onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              required
            >
              <option value="">Pilih Jenis</option>
              <option value="baru">Baru</option>
              <option value="bekas">Bekas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perhiasan
            </label>
            <select
              value={formData.perhiasan}
              onChange={(e) => setFormData({ ...formData, perhiasan: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              required
            >
              <option value="">Pilih Perhiasan</option>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              placeholder="Model perhiasan"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Beli (Rp)
            </label>
            <input
              type="number"
              value={formData.harga}
              onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              placeholder="Catatan tambahan"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
          <Link
            href={`/dashboard/purchases/${seri}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
