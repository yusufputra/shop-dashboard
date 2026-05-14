import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/auth/require-api-permission'
import { createServiceRoleClient } from '@/lib/auth/load-session'

type GroupEmbed = {
  group_id: string
  user_groups: { name: string } | null
}

type LoginOneRow = {
  user_id: string
  nama: string
  email: string | null
  is_superuser: boolean
  created_at: string
  login_user_groups: GroupEmbed[] | null
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  const gate = await requirePermission('users', 'read')
  if (!gate.ok) return gate.response

  const { userId } = await ctx.params
  if (!userId) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

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
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
  }

  const row = data as unknown as LoginOneRow
  return NextResponse.json({
    user: {
      user_id: row.user_id,
      nama: row.nama,
      email: row.email,
      is_superuser: row.is_superuser,
      created_at: row.created_at,
      group_ids: (row.login_user_groups ?? []).map((m) => m.group_id),
      groups: (row.login_user_groups ?? []).map((m) => ({
        group_id: m.group_id,
        name: m.user_groups?.name ?? '',
      })),
    },
  })
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  const gate = await requirePermission('users', 'update')
  if (!gate.ok) return gate.response

  const { userId } = await ctx.params
  if (!userId) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

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

  const updates: Record<string, unknown> = {}

  if (typeof body.nama === 'string' && body.nama.trim()) {
    updates.nama = body.nama.trim()
  }
  if (body.email !== undefined) {
    const e = typeof body.email === 'string' ? body.email.trim() : ''
    updates.email = e === '' ? null : e
  }
  if (typeof body.is_superuser === 'boolean') {
    updates.is_superuser = body.is_superuser
  }
  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }
    updates.password = await bcrypt.hash(body.password, 10)
  }

  if (Object.keys(updates).length > 0) {
    const { error: upErr } = await supabase
      .from('login')
      .update(updates)
      .eq('user_id', userId)
    if (upErr) {
      const code = upErr.code === '23505' ? 409 : 500
      return NextResponse.json({ error: upErr.message }, { status: code })
    }
  }

  if (Array.isArray(body.group_ids)) {
    const groupIds = body.group_ids.filter(
      (id): id is string => typeof id === 'string' && id.length > 0
    )
    await supabase.from('login_user_groups').delete().eq('user_id', userId)
    if (groupIds.length > 0) {
      const { error: memErr } = await supabase.from('login_user_groups').insert(
        groupIds.map((group_id) => ({ user_id: userId, group_id }))
      )
      if (memErr) {
        return NextResponse.json({ error: memErr.message }, { status: 500 })
      }
    }
    const primary = groupIds[0] ?? null
    await supabase.from('login').update({ group_id: primary }).eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  const gate = await requirePermission('users', 'delete')
  if (!gate.ok) return gate.response

  const { userId } = await ctx.params
  if (!userId) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

  if (userId === gate.session.userId) {
    return NextResponse.json(
      { error: 'Tidak bisa menghapus akun yang sedang dipakai.' },
      { status: 400 }
    )
  }

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { error } = await supabase.from('login').delete().eq('user_id', userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
