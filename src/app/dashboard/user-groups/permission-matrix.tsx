'use client'

import {
  MENU_KEYS,
  MENU_LABELS,
  type MenuKey,
  type PermissionAction,
  type PermissionsMap,
} from '@/lib/auth/permissions'

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'read', label: 'Baca' },
  { key: 'create', label: 'Buat' },
  { key: 'update', label: 'Ubah' },
  { key: 'delete', label: 'Hapus' },
]

type PermissionMatrixProps = {
  value: PermissionsMap
  onChange: (next: PermissionsMap) => void
}

export function PermissionMatrix({ value, onChange }: PermissionMatrixProps) {
  function toggle(menu: MenuKey, action: PermissionAction) {
    onChange({
      ...value,
      [menu]: { ...value[menu], [action]: !value[menu][action] },
    })
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-900">
              Menu
            </th>
            {ACTIONS.map((a) => (
              <th
                key={a.key}
                className="px-2 py-2 text-center font-medium text-gray-900"
              >
                {a.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {MENU_KEYS.map((menu) => (
            <tr key={menu}>
              <td className="px-3 py-2 font-medium text-gray-800">
                {MENU_LABELS[menu]}
              </td>
              {ACTIONS.map((a) => (
                <td key={a.key} className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={value[menu][a.key]}
                    onChange={() => toggle(menu, a.key)}
                    className="h-4 w-4 accent-amber-600"
                    aria-label={`${MENU_LABELS[menu]} — ${a.label}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
