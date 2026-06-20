'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { GadaiPerhiasan } from '@/types/database'
import { resolveCustomerIdByPublicId } from '@/lib/customers/resolve'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import { normalizePerhiasanForSelect, PERHIASAN_OPTIONS } from '@/lib/perhiasan-options'
import { KADAR_K_OPTIONS, parseKadarKSelect, formatCurrency } from '@/lib/utils'
import { decodeGadaiInvoiceParam, gadaiInvoicePath } from '@/lib/gadai/invoice-path'
import { computeTotalPelunasan, parseMoneyInput } from '@/lib/gadai/settlement'

export default function EditGadaiPage({
  params,
}: {
  params: Promise<{ noInvoice: string }>
}) {
  useRoutePermissionGuard('gadai', 'update')
  const { noInvoice: rawNoInvoice } = use(params)
  const noInvoice = decodeGadaiInvoiceParam(rawNoInvoice)
  const invoicePath = gadaiInvoicePath(noInvoice)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [customerPublicId, setCustomerPublicId] = useState('')
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    perhiasan: '',
    model: '',
    kadar: '',
    berat: '',
    harga_barang: '',
    uang_dipinjam: '',
    bunga: '',
    tgl_peminjaman: '',
    tgl_pelunasan: '',
  })

  useEffect(() => {
    async function loadItem() {
      try {
        const { data, error } = await supabase
          .from('gadai_perhiasan')
          .select('*, customers(public_id)')
          .eq('no_invoice', noInvoice)
          .single()

        if (error) throw error

        const row = data as GadaiPerhiasan & {
          customers?: { public_id: string } | null
        }
        setCustomerPublicId(String(row.customers?.public_id ?? '').trim())
        setExistingPhoto(row.foto_pelunasan)
        setFormData({
          nama: row.nama,
          nik: row.nik || '',
          perhiasan: normalizePerhiasanForSelect(row.perhiasan),
          model: row.model,
          kadar: row.kadar == null ? '' : `${row.kadar}K`,
          berat: String(row.berat),
          harga_barang: String(row.harga_barang),
          uang_dipinjam: String(row.uang_dipinjam),
          bunga: String(row.bunga ?? 0),
          tgl_peminjaman: new Date(row.tgl_peminjaman).toISOString().split('T')[0],
          tgl_pelunasan: row.tgl_pelunasan
            ? new Date(row.tgl_pelunasan).toISOString().split('T')[0]
            : '',
        })
      } catch (error) {
        console.error('Error loading gadai:', error)
        alert('Gagal memuat data')
        router.push('/dashboard/gadai')
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [noInvoice, supabase, router])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewPhoto(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveExistingPhoto = () => {
    if (existingPhoto) {
      setPhotoToDelete(existingPhoto)
      setExistingPhoto(null)
    }
  }

  const handleRemoveNewPhoto = () => {
    setNewPhoto(null)
    setPhotoPreview(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const rawPid = customerPublicId.trim()
      let customerId: string | null = null
      if (rawPid) {
        customerId = await resolveCustomerIdByPublicId(supabase, rawPid)
        if (!customerId) {
          alert('Member ID tidak ditemukan. Kosongkan atau perbaiki ID.')
          return
        }
      }

      const kadarNum = formData.kadar ? parseKadarKSelect(formData.kadar) : null
      if (formData.kadar && kadarNum == null) {
        alert('Kadar tidak valid')
        return
      }

      let fotoPelunasan: string | null = existingPhoto

      if (photoToDelete) {
        const path = photoToDelete.split('/').slice(-2).join('/')
        await supabase.storage.from('jewelry-images').remove([path])
        fotoPelunasan = null
      }

      if (newPhoto) {
        setUploadingPhoto(true)
        const fileExt = newPhoto.name.split('.').pop()
        const fileName = `${noInvoice.replace(/[^a-zA-Z0-9-_]/g, '_')}_${Date.now()}.${fileExt}`
        const filePath = `gadai/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('jewelry-images')
          .upload(filePath, newPhoto, { cacheControl: '3600', upsert: false })

        if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`)

        const {
          data: { publicUrl },
        } = supabase.storage.from('jewelry-images').getPublicUrl(filePath)
        fotoPelunasan = publicUrl
      }

      const uangDipinjam = parseFloat(formData.uang_dipinjam)
      const bunga = parseMoneyInput(formData.bunga)
      const totalPelunasan = computeTotalPelunasan(uangDipinjam, bunga)

      const { error } = await supabase
        .from('gadai_perhiasan')
        .update({
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
          foto_pelunasan: fotoPelunasan,
        })
        .eq('no_invoice', noInvoice)

      if (error) throw error
      router.push(`/dashboard/gadai/${invoicePath}`)
    } catch (error) {
      console.error('Error updating gadai:', error)
      alert('Gagal mengupdate data')
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const totalPelunasan = computeTotalPelunasan(
    parseMoneyInput(formData.uang_dipinjam),
    parseMoneyInput(formData.bunga)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/gadai/${invoicePath}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Gadai</h1>
          <p className="text-gray-600">{noInvoice}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member ID (opsional)
            </label>
            <input
              type="text"
              autoComplete="off"
              value={customerPublicId}
              onChange={(e) => setCustomerPublicId(e.target.value)}
              placeholder="Nomor pelanggan dari menu Pelanggan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
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
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto Pelunasan
            </label>
            <div className="space-y-4">
              {existingPhoto && !newPhoto && (
                <div className="relative inline-block">
                  <div className="w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={existingPhoto}
                      alt="Foto pelunasan"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveExistingPhoto}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {photoPreview && (
                <div className="relative inline-block">
                  <div className="w-48 h-48 rounded-lg overflow-hidden border border-amber-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveNewPhoto}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!newPhoto && (
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {existingPhoto ? 'Ganti foto pelunasan' : 'Unggah foto pelunasan'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={saving || uploadingPhoto}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>
              {saving || uploadingPhoto ? 'Menyimpan...' : 'Simpan Perubahan'}
            </span>
          </button>
          <Link
            href={`/dashboard/gadai/${invoicePath}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
