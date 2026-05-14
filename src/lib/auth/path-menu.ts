import type { MenuKey } from '@/lib/auth/permissions'

export function pathnameToMenuKey(pathname: string): MenuKey | null {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/inventory')) return 'inventory'
  if (pathname.startsWith('/dashboard/sales')) return 'sales'
  if (pathname.startsWith('/dashboard/purchases')) return 'purchases'
  if (pathname.startsWith('/dashboard/orders')) return 'orders'
  if (pathname.startsWith('/dashboard/calculator')) return 'calculator'
  if (pathname.startsWith('/dashboard/user-groups')) return 'user_groups'
  if (pathname.startsWith('/dashboard/customers')) return 'customers'
  if (pathname.startsWith('/dashboard/users')) return 'users'
  return null
}
