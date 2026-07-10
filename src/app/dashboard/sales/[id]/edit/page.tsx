'use client'

import { alertDialog } from '@/lib/desktop/dialogs'
import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import { resolveCustomerIdByPublicId } from '@/lib/customers/resolve'

type SaleEdit = {
  no: string
  tanggal: string
  stok_seri: string
  nama_pembeli: string
  alamat: string
  no_telp: string
  customer_public_id: string
  harga_jual: number
  biaya: number | null
  keterangan: string | null
}

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  useRoutePermissionGuard('sales', 'update')
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<SaleEdit>({
    no: '',
    tanggal: '',
    stok_seri: '',
    nama_pembeli: '',
    alamat: '',
    no_telp: '',
    customer_public_id: '',
    harga_jual: 0,
    biaya: null,
    keterangan: ''
  })

  useEffect(() => {
    loadSale()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  const loadSale = async () => {
    try {
      const { data, error } = await supabase
        .from('penjualan_perhiasan')
        .select('*, customers(public_id)')
        .eq('no', resolvedParams.id)
        .single()

      if (error) throw error
      const row = data as typeof data & {
        customers?: { public_id: string } | null
      }
      setFormData({
        no: row.no,
        tanggal: row.tanggal,
        stok_seri: row.stok_seri,
        nama_pembeli: row.nama_pembeli,
        alamat: row.alamat,
        no_telp: row.no_telp ?? '',
        customer_public_id: String(row.customers?.public_id ?? '').trim(),
        harga_jual: row.harga_jual,
        biaya: row.biaya,
        keterangan: row.keterangan || ''
      })
    } catch (error) {
      console.error('Error loading sale:', error)
      await alertDialog('Gagal memuat data penjualan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let customerId: string | null = null
      const rawPid = formData.customer_public_id.trim()
      if (rawPid) {
        customerId = await resolveCustomerIdByPublicId(supabase, rawPid)
        if (!customerId) {
          await alertDialog('ID pelanggan tidak ditemukan. Kosongkan atau perbaiki ID.')
          return
        }
      }

      const { error } = await supabase
        .from('penjualan_perhiasan')
        .update({
          tanggal: formData.tanggal,
          nama_pembeli: formData.nama_pembeli,
          alamat: formData.alamat,
          no_telp: formData.no_telp,
          customer_id: customerId,
          harga_jual: formData.harga_jual,
          biaya: formData.biaya,
          keterangan: formData.keterangan || null
        })
        .eq('no', resolvedParams.id)

      if (error) throw error
      router.push(`/dashboard/sales/${resolvedParams.id}`)
    } catch (error) {
      console.error('Error updating sale:', error)
      await alertDialog('Gagal mengupdate data penjualan')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'harga_jual' || name === 'biaya' ? (value ? parseFloat(value) : (name === 'biaya' ? null : 0)) : value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/sales/${resolvedParams.id}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Penjualan</h1>
          <p className="text-gray-600">No: {formData.no}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Barang yang dipilih (Seri: {formData.stok_seri}) tidak dapat diubah. 
            Untuk mengganti barang, hapus penjualan ini dan buat yang baru.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Harga Jual (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="harga_jual"
              value={formData.harga_jual}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ongkos (Rp)
            </label>
            <input
              type="number"
              name="biaya"
              value={formData.biaya || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pembeli <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_pembeli"
              value={formData.nama_pembeli}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="no_telp"
              value={formData.no_telp}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor pelanggan (opsional)
            </label>
            <input
              type="text"
              name="customer_public_id"
              autoComplete="off"
              value={formData.customer_public_id}
              onChange={handleChange}
              placeholder="Dari menu Pelanggan — mengisi di sini tidak menambah poin untuk transaksi lama"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
          <Link
            href={`/dashboard/sales/${resolvedParams.id}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
