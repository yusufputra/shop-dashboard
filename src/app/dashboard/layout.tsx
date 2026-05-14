'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Calculator,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Users,
  UsersRound,
  Award,
  type LucideIcon,
  Gem,
} from 'lucide-react'
import { useState } from 'react'
import type { MenuKey } from '@/lib/auth/permissions'
import {
  DashboardAuthProvider,
  useDashboardAuth,
} from '@/app/dashboard/dashboard-auth-context'

const navigation: {
  name: string
  href: string
  icon: LucideIcon
  menuKey: MenuKey
}[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, menuKey: 'dashboard' },
  { name: 'Stok Perhiasan', href: '/dashboard/inventory', icon: Package, menuKey: 'inventory' },
  { name: 'Penjualan', href: '/dashboard/sales', icon: TrendingUp, menuKey: 'sales' },
  { name: 'Pembelian', href: '/dashboard/purchases', icon: ShoppingCart, menuKey: 'purchases' },
  { name: 'Pesanan', href: '/dashboard/orders', icon: ClipboardList, menuKey: 'orders' },
  { name: 'Kalkulator Emas', href: '/dashboard/calculator', icon: Calculator, menuKey: 'calculator' },
  { name: 'Pengguna', href: '/dashboard/users', icon: Users, menuKey: 'users' },
  { name: 'Grup pengguna', href: '/dashboard/user-groups', icon: UsersRound, menuKey: 'user_groups' },
  { name: 'Pelanggan', href: '/dashboard/customers', icon: Award, menuKey: 'customers' },
]

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, session, can } = useDashboardAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleNav = navigation.filter((item) =>
    ready ? can(item.menuKey, 'read') : false
  )

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const title =
    navigation.find((item) => item.href === pathname)?.name || 'Dashboard'

  const initial =
    session?.nama?.trim()?.charAt(0)?.toUpperCase() ||
    session?.email?.trim()?.charAt(0)?.toUpperCase() ||
    '·'

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 transform bg-gradient-to-b from-amber-600 to-yellow-600 shadow-xl transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-amber-500 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Gem className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">KAIROS</h1>
                <p className="text-xs text-amber-100">Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-white hover:bg-amber-700 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {!ready && (
              <p className="px-4 text-sm text-amber-100/90">Memuat menu…</p>
            )}
            {visibleNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-lg px-4 py-3 transition-all
                    ${
                      isActive
                        ? 'bg-white text-amber-600 shadow-md'
                        : 'text-white hover:bg-amber-700'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-amber-500 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white transition-all hover:bg-amber-700"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {session?.nama || 'Pengguna'}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.isSuperuser && !session?.groupNames?.length
                    ? 'Superuser'
                    : session?.groupNames?.length
                      ? session.groupNames.join(', ')
                      : '—'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-sm font-semibold text-white shadow-md">
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardAuthProvider>
  )
}
