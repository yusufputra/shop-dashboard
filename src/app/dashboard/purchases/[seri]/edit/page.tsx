'use client'

import { alertDialog } from '@/lib/desktop/dialogs'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { PembelianPerhiasan } from '@/types/database'
import { resolveCustomerIdByPublicId } from '@/lib/customers/resolve'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import { normalizePerhiasanForSelect, PERHIASAN_OPTIONS } from '@/lib/perhiasan-options'
import { KADAR_K_OPTIONS, parseKadarKSelect } from '@/lib/utils'

export default function EditPurchasePage({ params }: { params: Promise<{ seri: string }> }) {
  useRoutePermissionGuard('purchases', 'update')
  const { seri } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customerPublicId, setCustomerPublicId] = useState('')
  const [formData, setFormData] = useState<Partial<PembelianPerhiasan>>({
    nama: '',
    alamat: '',
    perhiasan: '',
    model: '',
    berat: 0,
    harga: 0,
    potongan: null,
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: ''
  })

  useEffect(() => {
    async function loadPurchase() {
      try {
        const { data, error } = await supabase
          .from('pembelian_perhiasan')
          .select('*, customers(public_id)')
          .eq('seri', seri)
          .single()

        if (error) throw error
        
        const row = data as PembelianPerhiasan & {
          customers?: { public_id: string } | null
        }
        setCustomerPublicId(String(row.customers?.public_id ?? '').trim())
        const { customers: _cust, ...rest } = row
        setFormData({
          ...rest,
          perhiasan: normalizePerhiasanForSelect(rest.perhiasan ?? ''),
          tanggal: new Date(rest.tanggal).toISOString().split('T')[0]
        })
      } catch (error) {
        console.error('Error loading purchase:', error)
        await alertDialog('Gagal memuat data')
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
      let customerId: string | null = null
      const rawPid = customerPublicId.trim()
      if (rawPid) {
        customerId = await resolveCustomerIdByPublicId(supabase, rawPid)
        if (!customerId) {
          await alertDialog('ID pelanggan tidak ditemukan. Kosongkan atau perbaiki ID.')
          return
        }
      }

      const { error } = await supabase
        .from('pembelian_perhiasan')
        .update({
          nama: formData.nama,
          alamat: formData.alamat,
          kadar: formData.kadar ?? null,
          perhiasan: formData.perhiasan,
          model: formData.model,
          berat: formData.berat,
          harga: formData.harga,
          potongan: formData.potongan ?? null,
          tanggal: formData.tanggal,
          keterangan: formData.keterangan || null,
          customer_id: customerId
        })
        .eq('seri', seri)

      if (error) throw error

      router.push(`/dashboard/purchases/${seri}`)
    } catch (error) {
      console.error('Error updating purchase:', error)
      await alertDialog('Gagal mengupdate data')
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor pelanggan (opsional)
            </label>
            <input
              type="text"
              autoComplete="off"
              value={customerPublicId}
              onChange={(e) => setCustomerPublicId(e.target.value)}
              placeholder="Nomor pelanggan dari menu Pelanggan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kadar</label>
            <select
              value={formData.kadar == null ? '' : `${formData.kadar}K`}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kadar: parseKadarKSelect(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Belum diisi</option>
              {KADAR_K_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
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
              {PERHIASAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potongan / Spread (Rp)
            </label>
            <input
              type="number"
              value={formData.potongan ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  potongan: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
              placeholder="Opsional"
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
