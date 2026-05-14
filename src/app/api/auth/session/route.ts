import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { verifySession } from '@/lib/auth/jwt'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 })
  }
  return NextResponse.json({ session })
}
