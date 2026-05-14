'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import { emptyPermissions, type PermissionsMap } from '@/lib/auth/permissions'
import { PermissionMatrix } from '@/app/dashboard/user-groups/permission-matrix'

export default function EditUserGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  useRoutePermissionGuard('user_groups', 'update')
  const { groupId } = use(params)
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<PermissionsMap>(emptyPermissions())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/rbac/groups/${groupId}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Grup tidak ditemukan')
        setLoading(false)
        return
      }
      const g = data.group as {
        name: string
        description: string | null
        permissions: PermissionsMap
      }
      setName(g.name)
      setDescription(g.description ?? '')
      setPermissions(g.permissions ?? emptyPermissions())
      setLoading(false)
    })()
  }, [groupId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/rbac/groups/${groupId}`, {
        method: 'PATCH',
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Ubah grup</h1>
          <p className="text-gray-600">{name}</p>
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
            Deskripsi
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
          <p className="mb-2 text-sm font-medium text-gray-700">Izin akses menu</p>
          <PermissionMatrix value={permissions} onChange={setPermissions} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 py-3 font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
      </form>
    </div>
  )
}
