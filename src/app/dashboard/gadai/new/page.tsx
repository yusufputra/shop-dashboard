'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { generateSerialNumber, KADAR_K_OPTIONS, parseKadarKSelect, formatCurrency } from '@/lib/utils'
import { fetchCustomerByPublicId, resolveCustomerIdByPublicId } from '@/lib/customers/resolve'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import { createdByFields } from '@/lib/audit/created-by'
import { PERHIASAN_OPTIONS } from '@/lib/perhiasan-options'
import { computeTotalPelunasan, parseMoneyInput } from '@/lib/gadai/settlement'

export default function NewGadaiPage() {
  useRoutePermissionGuard('gadai', 'create')
  const { session } = useDashboardAuth()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false)
  const [customerLookupMessage, setCustomerLookupMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    no_invoice: generateSerialNumber('GAD'),
    customer_public_id: '',
    nama: '',
    nik: '',
    no_telp: '',
    alamat: '',
    email: '',
    perhiasan: '',
    model: '',
    kadar: '',
    berat: '',
    harga_barang: '',
    uang_dipinjam: '',
    bunga: '',
    tgl_peminjaman: new Date().toISOString().split('T')[0],
    tgl_pelunasan: '',
  })

  const lookupCustomerFromPublicId = async (raw: string) => {
    const id = raw.trim()
    if (!id) {
      setCustomerLookupMessage(null)
      return
    }

    setCustomerLookupLoading(true)
    setCustomerLookupMessage(null)
    try {
      const row = await fetchCustomerByPublicId(supabase, id)
      if (row) {
        setFormData((prev) => ({
          ...prev,
          customer_public_id: id,
          nama: row.nama,
          nik: row.nik?.trim() ?? '',
          no_telp: row.phone?.trim() ?? '',
          alamat: row.alamat?.trim() ?? '',
          email: row.email?.trim() ?? '',
        }))
        setCustomerLookupMessage(
          'Pelanggan ditemukan — nama, NIK, telepon, alamat, dan email sudah diisi otomatis.'
        )
      } else {
        setFormData((prev) => ({
          ...prev,
          customer_public_id: id,
        }))
        setCustomerLookupMessage(
          'Member ID tidak terdaftar — isi data pelanggan secara manual.'
        )
      }
    } finally {
      setCustomerLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const rawPid = formData.customer_public_id.trim()
      let customerId: string | null = null
      if (rawPid) {
        customerId = await resolveCustomerIdByPublicId(supabase, rawPid)
        if (!customerId) {
          alert('Member ID tidak ditemukan. Kosongkan atau perbaiki dari menu Pelanggan.')
          return
        }
      }

      const kadarNum = formData.kadar ? parseKadarKSelect(formData.kadar) : null
      if (formData.kadar && kadarNum == null) {
        alert('Kadar tidak valid')
        return
      }

      const uangDipinjam = parseFloat(formData.uang_dipinjam)
      const bunga = parseMoneyInput(formData.bunga)
      const totalPelunasan = computeTotalPelunasan(uangDipinjam, bunga)

      const { error } = await supabase.from('gadai_perhiasan').insert([
        {
          no_invoice: formData.no_invoice.trim(),
          customer_id: customerId,
          nama: formData.nama.trim(),
          nik: formData.nik.trim() || null,
          perhiasan: formData.perhiasan,
          model: formData.model.trim(),
          kadar: kadarNum,
          berat: parseFloat(formData.berat),
          harga_barang: parseFloat(formData.harga_barang),
          uang_dipinjam: uangDipinjam,
          bunga,
          total_pelunasan: totalPelunasan,
          tgl_peminjaman: formData.tgl_peminjaman,
          tgl_pelunasan: formData.tgl_pelunasan || null,
          ...createdByFields(session),
        },
      ])

      if (error) throw error
      router.push('/dashboard/gadai')
    } catch (error) {
      console.error('Error adding gadai:', error)
      alert('Gagal menambahkan data gadai')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === 'customer_public_id') {
      setCustomerLookupMessage(null)
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const totalPelunasan = computeTotalPelunasan(
    parseMoneyInput(formData.uang_dipinjam),
    parseMoneyInput(formData.bunga)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/gadai" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Gadai</h1>
          <p className="text-gray-600">Catat transaksi gadai perhiasan baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Invoice <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="no_invoice"
              value={formData.no_invoice}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member ID (opsional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="text"
                name="customer_public_id"
                autoComplete="off"
                value={formData.customer_public_id}
                onChange={handleChange}
                onBlur={(e) => {
                  void lookupCustomerFromPublicId(e.target.value)
                }}
                placeholder="Isi lalu klik Cari atau klik di luar kolom"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black sm:flex-1"
              />
              <button
                type="button"
                disabled={customerLookupLoading}
                onClick={() => void lookupCustomerFromPublicId(formData.customer_public_id)}
                className="shrink-0 rounded-lg border border-amber-600 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                {customerLookupLoading ? 'Mencari…' : 'Cari pelanggan'}
              </button>
            </div>
            {customerLookupMessage && (
              <p
                className={`text-xs mt-1 font-medium ${
                  customerLookupMessage.includes('ditemukan —')
                    ? 'text-green-700'
                    : customerLookupMessage.includes('tidak terdaftar')
                      ? 'text-red-700'
                      : 'text-amber-800'
                }`}
              >
                {customerLookupMessage}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Jika Member ID valid, field pelanggan di bawah terisi otomatis dari data Pelanggan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pelanggan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NIK</label>
            <input
              type="text"
              name="nik"
              value={formData.nik}
              onChange={handleChange}
              placeholder="Nomor Induk Kependudukan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
            <input
              type="text"
              name="no_telp"
              value={formData.no_telp}
              onChange={handleChange}
              placeholder="Nomor telepon pelanggan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email pelanggan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              rows={2}
              placeholder="Alamat pelanggan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perhiasan <span className="text-red-500">*</span>
            </label>
            <select
              name="perhiasan"
              value={formData.perhiasan}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
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
              Nama Barang / Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kadar</label>
            <select
              name="kadar"
              value={formData.kadar}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Kadar</option>
              {KADAR_K_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berat Barang (gram) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              name="berat"
              value={formData.berat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Barang (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="harga_barang"
              value={formData.harga_barang}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uang Dipinjam (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="uang_dipinjam"
              value={formData.uang_dipinjam}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bunga (Rp)
            </label>
            <input
              type="number"
              name="bunga"
              value={formData.bunga}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Pelunasan (Rp)
            </label>
            <div className="w-full px-4 py-3 border border-amber-200 bg-amber-50 rounded-lg text-lg font-bold text-amber-900">
              {formatCurrency(totalPelunasan)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Otomatis: uang dipinjam + bunga
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tgl Peminjaman <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tgl_peminjaman"
              value={formData.tgl_peminjaman}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tgl Pelunasan
            </label>
            <input
              type="date"
              name="tgl_pelunasan"
              value={formData.tgl_pelunasan}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
            <p className="text-xs text-gray-500 mt-1">
              Kosongkan jika belum lunas. Foto pelunasan bisa diunggah saat edit.
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-md disabled:opacity-50"
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
            href="/dashboard/gadai"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
