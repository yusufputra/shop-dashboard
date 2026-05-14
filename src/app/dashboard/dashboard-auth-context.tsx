'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import type { SessionPayload } from '@/lib/auth/jwt'
import {
  canAccess,
  type MenuKey,
  type PermissionAction,
} from '@/lib/auth/permissions'

type DashboardAuthContextValue = {
  ready: boolean
  session: SessionPayload | null
  can: (menu: MenuKey, action: PermissionAction) => boolean
  refresh: () => Promise<void>
}

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(
  null
)

export function DashboardAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<SessionPayload | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/auth/session')
    const data = (await res.json()) as { session: SessionPayload | null }
    if (!res.ok || !data.session) {
      setSession(null)
      setReady(true)
      router.push('/login')
      return
    }
    setSession(data.session)
    setReady(true)
  }, [router])

  useEffect(() => {
    void load()
  }, [load])

  const can = useCallback(
    (menu: MenuKey, action: PermissionAction) =>
      session
        ? canAccess(session.isSuperuser, session.permissions, menu, action)
        : false,
    [session]
  )

  const value = useMemo(
    () => ({ ready, session, can, refresh: load }),
    [ready, session, can, load]
  )

  return (
    <DashboardAuthContext.Provider value={value}>
      {children}
    </DashboardAuthContext.Provider>
  )
}

export function useDashboardAuth() {
  const ctx = useContext(DashboardAuthContext)
  if (!ctx) {
    throw new Error('useDashboardAuth must be used under DashboardAuthProvider')
  }
  return ctx
}

export function useRoutePermissionGuard(
  menu: MenuKey,
  action: PermissionAction
) {
  const { ready, can } = useDashboardAuth()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    if (!can(menu, action)) {
      router.replace('/dashboard/forbidden')
    }
  }, [ready, can, menu, action, router])
}
