'use client'

import { alertDialog, confirmDialog } from '@/lib/desktop/dialogs'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useDashboardAuth,
  useRoutePermissionGuard,
} from '@/app/dashboard/dashboard-auth-context'
import type { PermissionsMap } from '@/lib/auth/permissions'
import { MENU_LABELS, type MenuKey } from '@/lib/auth/permissions'

type GroupRow = {
  group_id: string
  name: string
  description: string | null
  created_at: string
  permissions: PermissionsMap
}

function countActiveMenus(map: PermissionsMap): number {
  let n = 0
  for (const key of Object.keys(map) as MenuKey[]) {
    const p = map[key]
    if (p.read || p.create || p.update || p.delete) n++
  }
  return n
}

export default function UserGroupsPage() {
  useRoutePermissionGuard('user_groups', 'read')
  const { can } = useDashboardAuth()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/rbac/groups')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuat')
      setGroups(data.groups ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete(groupId: string, name: string) {
    if (!await confirmDialog(`Hapus grup "${name}"? Pengguna akan dilepas dari grup ini.`)) return
    const res = await fetch(`/api/rbac/groups/${groupId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      await alertDialog(typeof data.error === 'string' ? data.error : 'Gagal menghapus')
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
          <h1 className="text-2xl font-bold text-gray-900">Grup pengguna</h1>
          <p className="text-gray-600">
            Buat grup dan tentukan izin per menu (baca, buat, ubah, hapus).
          </p>
        </div>
        {can('user_groups', 'create') && (
          <Link
            href="/dashboard/user-groups/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah grup</span>
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
                  Nama grup
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-900">
                  Deskripsi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-900">
                  Ringkasan izin
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-900">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    Belum ada grup
                  </td>
                </tr>
              ) : (
                groups.map((g) => {
                  const activeMenus = countActiveMenus(g.permissions)
                  const labels = (Object.keys(g.permissions) as MenuKey[])
                    .filter(
                      (k) =>
                        g.permissions[k].read ||
                        g.permissions[k].create ||
                        g.permissions[k].update ||
                        g.permissions[k].delete
                    )
                    .map((k) => MENU_LABELS[k])
                    .slice(0, 6)
                  const more =
                    activeMenus > labels.length
                      ? ` +${activeMenus - labels.length}`
                      : ''

                  return (
                    <tr key={g.group_id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {g.name}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-sm text-gray-600">
                        {g.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {activeMenus === 0 ? (
                          <span className="text-gray-400">Tidak ada izin</span>
                        ) : (
                          <span title={labels.join(', ')}>
                            {labels.join(', ')}
                            {more}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {can('user_groups', 'update') && (
                            <Link
                              href={`/dashboard/user-groups/${g.group_id}/edit`}
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                              title="Ubah"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {can('user_groups', 'delete') &&
                            g.name.trim().toLowerCase() !== 'administrator' && (
                              <button
                                type="button"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                title="Hapus"
                                onClick={() => void handleDelete(g.group_id, g.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
