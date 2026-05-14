'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'

type GroupOpt = { group_id: string; name: string; description: string | null }

export default function NewUserPage() {
  useRoutePermissionGuard('users', 'create')
  const router = useRouter()
  const [groups, setGroups] = useState<GroupOpt[]>([])
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/user-groups')
      const data = await res.json()
      if (res.ok) setGroups(data.groups ?? [])
    })()
  }, [])

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
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          email: email.trim() === '' ? null : email.trim(),
          password,
          is_superuser: isSuperuser,
          group_ids: Array.from(selectedGroups),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Gagal menyimpan')
      }
      router.push('/dashboard/users')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Tambah pengguna</h1>
          <p className="text-gray-600">Akun masuk dashboard (bukan Supabase Auth).</p>
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
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email (opsional, harus unik jika diisi)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-black outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
            Superuser (lewati semua cek izin menu)
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Grup pengguna</p>
          <p className="mb-3 text-xs text-gray-500">
            Satu pengguna bisa masuk banyak grup. Izin menu digabung (union) dari semua grup.
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada grup. Buat di Supabase dulu.</p>
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
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 py-3 font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Menyimpan…' : 'Simpan'}
        </button>
      </form>
    </div>
  )
}
