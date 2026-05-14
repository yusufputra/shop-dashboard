import { NextResponse, type NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/jwt'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { pathnameToMenuKey } from '@/lib/auth/path-menu'
import { canAccess } from '@/lib/auth/permissions'

export async function updateAuthSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null
  const session = token ? await verifySession(token) : null

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (session && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const path = request.nextUrl.pathname
    if (path !== '/dashboard/forbidden') {
      const menu = pathnameToMenuKey(path)
      if (menu && !canAccess(session.isSuperuser, session.permissions, menu, 'read')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/forbidden'
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}
