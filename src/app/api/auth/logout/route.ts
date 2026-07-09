import { NextResponse } from 'next/server'
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/auth/cookie-options'

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE_NAME, '', sessionCookieOptions(request, 0))
  return res
}
