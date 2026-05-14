import {
  MENU_KEYS,
  emptyPermissions,
  normalizePermissionsMap,
  type MenuKey,
  type PermissionsMap,
} from '@/lib/auth/permissions'

export function permissionsFromDbRows(
  rows: {
    menu_key: string
    can_read: boolean
    can_create: boolean
    can_update: boolean
    can_delete: boolean
  }[]
): PermissionsMap {
  const map = emptyPermissions()
  for (const row of rows) {
    const key = row.menu_key as string
    if (!MENU_KEYS.includes(key as MenuKey)) continue
    const k = key as MenuKey
    map[k] = {
      read: Boolean(row.can_read),
      create: Boolean(row.can_create),
      update: Boolean(row.can_update),
      delete: Boolean(row.can_delete),
    }
  }
  return map
}

export function dbRowsFromPermissionsMap(
  groupId: string,
  map: PermissionsMap
) {
  return MENU_KEYS.map((menu_key) => ({
    group_id: groupId,
    menu_key,
    can_read: map[menu_key].read,
    can_create: map[menu_key].create,
    can_update: map[menu_key].update,
    can_delete: map[menu_key].delete,
  }))
}

export function parsePermissionsBody(raw: unknown): PermissionsMap {
  if (!raw || typeof raw !== 'object') return emptyPermissions()
  return normalizePermissionsMap(raw)
}
