'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import { emptyPermissions, type PermissionsMap } from '@/lib/auth/permissions'
import { PermissionMatrix } from '@/app/dashboard/user-groups/permission-matrix'

export default function NewUserGroupPage() {
  useRoutePermissionGuard('user_groups', 'create')
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<PermissionsMap>(emptyPermissions())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/rbac/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description.trim() === '' ? null : description.trim(),
          permissions,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Gagal menyimpan')
      }
      router.push('/dashboard/user-groups')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/user-groups"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grup baru</h1>
          <p className="text-gray-600">
            Nama, deskripsi, dan matriks izin untuk tiap menu dashboard.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Nama grup <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Deskripsi (opsional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Izin akses menu
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Centang kombinasi Baca / Buat / Ubah / Hapus per menu. Pengguna
            dengan banyak grup mendapat gabungan (union) izin.
          </p>
          <PermissionMatrix value={permissions} onChange={setPermissions} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 py-3 font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Menyimpan…' : 'Simpan grup'}
        </button>
      </form>
    </div>
  )
}
