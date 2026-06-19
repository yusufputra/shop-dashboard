export const MENU_KEYS = [
  'dashboard',
  'inventory',
  'sales',
  'purchases',
  'orders',
  'gadai',
  'calculator',
  'users',
  'user_groups',
  'customers',
  'point_redeem',
] as const

export type MenuKey = (typeof MENU_KEYS)[number]

export type PermissionAction = 'read' | 'create' | 'update' | 'delete'

export type MenuPermissions = Record<PermissionAction, boolean>

export type PermissionsMap = Record<MenuKey, MenuPermissions>

export function emptyPermissions(): PermissionsMap {
  const nil = { read: false, create: false, update: false, delete: false }
  return {
    dashboard: { ...nil },
    inventory: { ...nil },
    sales: { ...nil },
    purchases: { ...nil },
    orders: { ...nil },
    gadai: { ...nil },
    calculator: { ...nil },
    users: { ...nil },
    user_groups: { ...nil },
    customers: { ...nil },
    point_redeem: { ...nil },
  }
}

export function fullPermissions(): PermissionsMap {
  const all = { read: true, create: true, update: true, delete: true }
  return {
    dashboard: { ...all },
    inventory: { ...all },
    sales: { ...all },
    purchases: { ...all },
    orders: { ...all },
    gadai: { ...all },
    calculator: { ...all },
    users: { ...all },
    user_groups: { ...all },
    customers: { ...all },
    point_redeem: { ...all },
  }
}

/** Gabungkan JSON dari DB / JWT agar selalu punya semua key menu */
export function normalizePermissionsMap(raw: unknown): PermissionsMap {
  const base = emptyPermissions()
  if (!raw || typeof raw !== 'object') return base
  for (const key of MENU_KEYS) {
    const v = (raw as Record<string, unknown>)[key]
    if (!v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    base[key] = {
      read: Boolean(o.read),
      create: Boolean(o.create),
      update: Boolean(o.update),
      delete: Boolean(o.delete),
    }
  }
  return base
}

export function canAccess(
  isSuperuser: boolean,
  permissions: PermissionsMap,
  menu: MenuKey,
  action: PermissionAction
): boolean {
  if (isSuperuser) return true
  return Boolean(permissions[menu]?.[action])
}

/** Label untuk UI matriks izin (bahasa Indonesia) */
export const MENU_LABELS: Record<MenuKey, string> = {
  dashboard: 'Dashboard',
  inventory: 'Stok perhiasan',
  sales: 'Penjualan',
  purchases: 'Pembelian',
  orders: 'Pesanan',
  gadai: 'Gadai',
  calculator: 'Kalkulator emas',
  users: 'Pengguna',
  user_groups: 'Grup pengguna',
  customers: 'Pelanggan & poin',
  point_redeem: 'Redeem poin',
}
