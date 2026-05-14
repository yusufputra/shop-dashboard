import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/require-api-permission'
import { createServiceRoleClient } from '@/lib/auth/load-session'
import {
  dbRowsFromPermissionsMap,
  parsePermissionsBody,
  permissionsFromDbRows,
} from '@/lib/rbac/group-permissions'

const PROTECTED_GROUP_NAME = 'administrator'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  const gate = await requirePermission('user_groups', 'read')
  if (!gate.ok) return gate.response

  const { groupId } = await ctx.params
  if (!groupId) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { data: group, error: gErr } = await supabase
    .from('user_groups')
    .select('group_id, name, description, created_at')
    .eq('group_id', groupId)
    .single()

  if (gErr || !group) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 })
  }

  const { data: permRows, error: pErr } = await supabase
    .from('group_menu_permissions')
    .select(
      'menu_key, can_read, can_create, can_update, can_delete'
    )
    .eq('group_id', groupId)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  return NextResponse.json({
    group: {
      ...group,
      permissions: permissionsFromDbRows(permRows ?? []),
    },
  })
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  const gate = await requirePermission('user_groups', 'update')
  if (!gate.ok) return gate.response

  const { groupId } = await ctx.params
  if (!groupId) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { data: existing } = await supabase
    .from('user_groups')
    .select('name')
    .eq('group_id', groupId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 })
  }

  let body: {
    name?: string
    description?: string | null
    permissions?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) {
    const newName = body.name.trim()
    if (
      existing.name.trim().toLowerCase() === PROTECTED_GROUP_NAME &&
      newName.trim().toLowerCase() !== PROTECTED_GROUP_NAME
    ) {
      return NextResponse.json(
        { error: 'Nama grup Administrator tidak boleh diubah.' },
        { status: 400 }
      )
    }
    updates.name = newName
  }
  if (body.description !== undefined) {
    updates.description =
      body.description === null
        ? null
        : String(body.description).trim() || null
  }

  if (Object.keys(updates).length > 0) {
    const { error: upErr } = await supabase
      .from('user_groups')
      .update(updates)
      .eq('group_id', groupId)
    if (upErr) {
      const code = upErr.code === '23505' ? 409 : 500
      return NextResponse.json({ error: upErr.message }, { status: code })
    }
  }

  if (body.permissions !== undefined) {
    const permMap = parsePermissionsBody(body.permissions)
    await supabase.from('group_menu_permissions').delete().eq('group_id', groupId)
    const { error: insErr } = await supabase
      .from('group_menu_permissions')
      .insert(dbRowsFromPermissionsMap(groupId, permMap))
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  const gate = await requirePermission('user_groups', 'delete')
  if (!gate.ok) return gate.response

  const { groupId } = await ctx.params
  if (!groupId) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { data: row } = await supabase
    .from('user_groups')
    .select('name')
    .eq('group_id', groupId)
    .single()

  if (!row) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 })
  }

  if (row.name.trim().toLowerCase() === PROTECTED_GROUP_NAME) {
    return NextResponse.json(
      { error: 'Grup Administrator tidak boleh dihapus.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('user_groups')
    .delete()
    .eq('group_id', groupId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
