'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { generateCustomerPublicId } from '@/lib/customers/public-id'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'

export default function NewCustomerPage() {
  useRoutePermissionGuard('customers', 'create')
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nama: '',
    phone: '',
    email: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      for (let i = 0; i < 12; i++) {
        const public_id = generateCustomerPublicId()
        const { error } = await supabase.from('customers').insert({
          public_id,
          nama: formData.nama.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
        })
        if (!error) {
          router.push(`/dashboard/customers/${public_id}`)
          return
        }
        if (error.code !== '23505') {
          console.error(error)
          alert('Gagal menyimpan pelanggan')
          return
        }
      }
      alert('Gagal membuat ID unik setelah beberapa percobaan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pelanggan baru</h1>
          <p className="text-gray-600">ID 10 digit dibuat otomatis (acak).</p>
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
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-white shadow-md transition-all hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? (
              <span>Menyimpan…</span>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/customers"
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
