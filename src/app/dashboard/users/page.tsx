'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Shield } from 'lucide-react'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'

type ListedUser = {
  user_id: string
  nama: string
  email: string | null
  is_superuser: boolean
  created_at: string
  groups: { group_id: string; name: string }[]
}

export default function UsersPage() {
  useRoutePermissionGuard('users', 'read')
  const { can, session } = useDashboardAuth()
  const [users, setUsers] = useState<ListedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuat')
      setUsers(data.users ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete(userId: string, nama: string) {
    if (!confirm(`Hapus pengguna "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(typeof data.error === 'string' ? data.error : 'Gagal menghapus')
      return
    }
    void load()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
          <p className="text-gray-600">
            Buat akun, atur beberapa grup per pengguna, dan izin mengikuti gabungan grup.
          </p>
        </div>
        {can('users', 'create') && (
          <Link
            href="/dashboard/users/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah pengguna</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => void load()}
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-900">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-900">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-900">
                  Grup
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-900">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    Belum ada pengguna
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{u.nama}</span>
                        {u.is_superuser && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            <Shield className="h-3 w-3" />
                            Superuser
                          </span>
                        )}
                        {u.user_id === session?.userId && (
                          <span className="text-xs text-gray-500">(Anda)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {u.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.groups.length === 0 ? (
                          <span className="text-sm text-gray-400">Belum ada grup</span>
                        ) : (
                          u.groups.map((g) => (
                            <span
                              key={g.group_id}
                              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-800"
                            >
                              {g.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {can('users', 'update') && (
                          <Link
                            href={`/dashboard/users/${u.user_id}/edit`}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            title="Ubah"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                        {can('users', 'delete') && u.user_id !== session?.userId && (
                          <button
                            type="button"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Hapus"
                            onClick={() => void handleDelete(u.user_id, u.nama)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
