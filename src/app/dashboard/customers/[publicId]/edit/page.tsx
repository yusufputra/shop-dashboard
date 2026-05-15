'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import { normalizePublicIdInput } from '@/lib/customers/public-id'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'

export default function EditCustomerPage({ params }: { params: Promise<{ publicId: string }> }) {
  useRoutePermissionGuard('customers', 'update')
  const { publicId: raw } = use(params)
  const publicId = normalizePublicIdInput(raw)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    alamat: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    if (publicId.length !== 10) {
      setLoading(false)
      setCustomerId(null)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('public_id', publicId)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          setCustomerId(null)
          return
        }
        setCustomerId(data.customer_id)
        setFormData({
          nama: data.nama,
          nik: data.nik?.replace(/\D/g, '') ?? '',
          alamat: data.alamat ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
        })
      } catch (e) {
        console.error(e)
        alert('Gagal memuat data pelanggan')
        router.push('/dashboard/customers')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [publicId, supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          nama: formData.nama.trim(),
          nik: formData.nik.replace(/\D/g, '').slice(0, 16) || null,
          alamat: formData.alamat.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
        })
        .eq('customer_id', customerId)

      if (error) throw error
      router.push(`/dashboard/customers/${publicId}`)
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  if (publicId.length !== 10 || !customerId) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-gray-600">Pelanggan tidak ditemukan.</p>
        <Link href="/dashboard/customers" className="text-amber-700 hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/customers/${publicId}`} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit pelanggan</h1>
          <p className="font-mono text-sm text-gray-600">ID program: {publicId} (tidak dapat diubah)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-md">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nama <span className="text-red-500">*</span>
          </label>
          <input
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">NIK</label>
          <input
            name="nik"
            inputMode="numeric"
            autoComplete="off"
            value={formData.nik}
            onChange={handleChange}
            placeholder="16 digit (opsional)"
            maxLength={20}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
          <p className="mt-1 text-xs text-gray-500">Hanya angka, maks. 16 digit.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Alamat</label>
          <textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            rows={3}
            placeholder="Alamat lengkap (opsional)"
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Telepon</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-4 border-t border-gray-200 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-white shadow-md transition-all hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? (
              <span>Menyimpan…</span>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan perubahan</span>
              </>
            )}
          </button>
          <Link
            href={`/dashboard/customers/${publicId}`}
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
