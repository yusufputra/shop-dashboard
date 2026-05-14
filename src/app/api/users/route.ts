import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/auth/require-api-permission'
import { createServiceRoleClient } from '@/lib/auth/load-session'

type GroupEmbed = {
  group_id: string
  user_groups: { name: string } | null
}

type LoginListRow = {
  user_id: string
  nama: string
  email: string | null
  is_superuser: boolean
  created_at: string
  login_user_groups: GroupEmbed[] | null
}

export async function GET() {
  const gate = await requirePermission('users', 'read')
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('login')
    .select(
      `
      user_id,
      nama,
      email,
      is_superuser,
      created_at,
      login_user_groups (
        group_id,
        user_groups ( name )
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users = ((data ?? []) as unknown as LoginListRow[]).map((row) => ({
    user_id: row.user_id,
    nama: row.nama,
    email: row.email,
    is_superuser: row.is_superuser,
    created_at: row.created_at,
    groups: (row.login_user_groups ?? []).map((m) => ({
      group_id: m.group_id,
      name: m.user_groups?.name ?? '',
    })),
  }))

  return NextResponse.json({ users: users ?? [] })
}

export async function POST(request: Request) {
  const gate = await requirePermission('users', 'create')
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  let body: {
    nama?: string
    email?: string | null
    password?: string
    is_superuser?: boolean
    group_ids?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const nama = body.nama?.trim() ?? ''
  const password = body.password ?? ''
  const emailRaw = body.email?.trim() ?? ''
  const email = emailRaw === '' ? null : emailRaw
  const isSuperuser = Boolean(body.is_superuser)
  const groupIds = Array.isArray(body.group_ids)
    ? body.group_ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []

  if (!nama || !password || password.length < 6) {
    return NextResponse.json(
      { error: 'Nama wajib, password minimal 6 karakter.' },
      { status: 400 }
    )
  }

  const hash = await bcrypt.hash(password, 10)

  const { data: inserted, error: insErr } = await supabase
    .from('login')
    .insert({
      nama,
      email,
      password: hash,
      is_superuser: isSuperuser,
    })
    .select('user_id')
    .single()

  if (insErr) {
    const code = insErr.code === '23505' ? 409 : 500
    return NextResponse.json(
      { error: insErr.message || 'Gagal membuat pengguna' },
      { status: code }
    )
  }

  const userId = inserted.user_id

  if (groupIds.length > 0) {
    const { error: memErr } = await supabase.from('login_user_groups').insert(
      groupIds.map((group_id) => ({ user_id: userId, group_id }))
    )
    if (memErr) {
      await supabase.from('login').delete().eq('user_id', userId)
      return NextResponse.json(
        { error: memErr.message || 'Gagal mengaitkan grup' },
        { status: 500 }
      )
    }
  }

  const primaryGroup = groupIds[0] ?? null
  await supabase.from('login').update({ group_id: primaryGroup }).eq('user_id', userId)

  return NextResponse.json({ user_id: userId })
}
