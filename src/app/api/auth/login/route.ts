import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '@/lib/auth/constants'
import { loadAuthForLoginRow } from '@/lib/auth/load-session'
import { signSession } from '@/lib/auth/jwt'

async function verifyStoredPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(plain, stored)
  }
  const a = Buffer.from(plain, 'utf8')
  const b = Buffer.from(stored, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: 'Server belum dikonfigurasi (Supabase service role).' },
      { status: 500 }
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const identifier = body.email?.trim() ?? ''
  const password = body.password ?? ''
  if (!identifier || !password) {
    return NextResponse.json(
      { error: 'Email/nama dan password wajib diisi.' },
      { status: 400 }
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const emailMatch = await supabase
    .from('login')
    .select('user_id, nama, email, password, group_id, is_superuser')
    .eq('email', identifier)
    .maybeSingle()

  let row = emailMatch.data
  if (!row) {
    const namaMatch = await supabase
      .from('login')
      .select('user_id, nama, email, password, group_id, is_superuser')
      .eq('nama', identifier)
      .maybeSingle()
    row = namaMatch.data
  }

  if (!row || !(await verifyStoredPassword(password, row.password))) {
    return NextResponse.json(
      { error: 'Email/nama atau password salah.' },
      { status: 401 }
    )
  }

  const authFields = await loadAuthForLoginRow(supabase, {
    user_id: row.user_id,
    group_id: row.group_id ?? null,
    is_superuser: row.is_superuser ?? null,
  })

  const token = await signSession({
    userId: row.user_id,
    nama: row.nama,
    email: row.email ?? null,
    ...authFields,
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SEC,
    path: '/',
  })
  return res
}
