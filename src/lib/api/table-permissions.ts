import type { MenuKey, PermissionAction } from '@/lib/auth/permissions'

/** Tables exposed through the DB proxy and which menus may access them. */
export const TABLE_MENUS: Record<string, MenuKey[]> = {
  stok_perhiasan: ['dashboard', 'inventory', 'sales'],
  penjualan_perhiasan: ['dashboard', 'sales'],
  pembelian_perhiasan: ['dashboard', 'purchases', 'inventory'],
  pesanan_perhiasan: ['dashboard', 'orders'],
  gadai_perhiasan: ['gadai'],
  customers: ['dashboard', 'customers', 'sales', 'purchases', 'gadai', 'point_redeem'],
  customer_point_ledger: ['customers', 'sales', 'point_redeem'],
  customer_point_redeem: ['customers', 'point_redeem'],
}

export const STORAGE_BUCKET_MENUS: Record<string, MenuKey[]> = {
  'jewelry-images': ['inventory', 'gadai'],
}

export function tableMenus(table: string): MenuKey[] | null {
  return TABLE_MENUS[table] ?? null
}

export function storageBucketMenus(bucket: string): MenuKey[] | null {
  return STORAGE_BUCKET_MENUS[bucket] ?? null
}

export function permissionAlternatives(
  menus: MenuKey[],
  action: PermissionAction
): { menu: MenuKey; action: PermissionAction }[] {
  return menus.map((menu) => ({ menu, action }))
}
