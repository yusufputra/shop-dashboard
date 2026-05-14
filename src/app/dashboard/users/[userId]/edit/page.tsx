'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'

type GroupOpt = { group_id: string; name: string; description: string | null }

type LoadedUser = {
  user_id: string
  nama: string
  email: string | null
  is_superuser: boolean
  group_ids: string[]
}

export default function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  useRoutePermissionGuard('users', 'update')
  const { userId } = use(params)
  const router = useRouter()
  const [groups, setGroups] = useState<GroupOpt[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [gRes, uRes] = await Promise.all([
        fetch('/api/user-groups'),
        fetch(`/api/users/${userId}`),
      ])
      const gData = await gRes.json()
      const uData = await uRes.json()
      if (gRes.ok) setGroups(gData.groups ?? [])
      if (!uRes.ok) {
        setError(uData.error || 'Pengguna tidak ditemukan')
        setInitialLoading(false)
        return
      }
      const u = uData.user as LoadedUser
      setNama(u.nama)
      setEmail(u.email ?? '')
      setIsSuperuser(u.is_superuser)
      setSelectedGroups(new Set(u.group_ids))
      setInitialLoading(false)
    })()
  }, [userId])

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        nama,
        email: email.trim() === '' ? null : email.trim(),
        is_superuser: isSuperuser,
        group_ids: Array.from(selectedGroups),
      }
      if (password.trim().length > 0) {
        body.password = password
      }
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Gagal menyimpan')
      }
      setPassword('')
      router.push('/dashboard/users')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/users"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubah pengguna</h1>
          <p className="text-gray-600">Nama, email, password, superuser, dan banyak grup.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-md"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="nama" className="mb-1 block text-sm font-medium text-gray-700">
            Nama <span className="text-red-500">*</span>
          </label>
          <input
            id="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email (opsional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password baru (kosongkan jika tidak diubah)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            autoComplete="new-password"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="super"
            type="checkbox"
            checked={isSuperuser}
            onChange={(e) => setIsSuperuser(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="super" className="text-sm text-gray-800">
            Superuser
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Grup pengguna</p>
          <p className="mb-3 text-xs text-gray-500">
            Hapus centang untuk melepas pengguna dari grup. Centang beberapa grup sekaligus.
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada grup.</p>
            ) : (
              groups.map((g) => (
                <label
                  key={g.group_id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(g.group_id)}
                    onChange={() => toggleGroup(g.group_id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-900">{g.name}</span>
                </label>
              ))
            )}
          </div>
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
