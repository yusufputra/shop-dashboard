import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/require-api-permission'
import { createServiceRoleClient } from '@/lib/auth/load-session'
import {
  dbRowsFromPermissionsMap,
  parsePermissionsBody,
  permissionsFromDbRows,
} from '@/lib/rbac/group-permissions'

export async function GET() {
  const gate = await requirePermission('user_groups', 'read')
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { data: groups, error: gErr } = await supabase
    .from('user_groups')
    .select('group_id, name, description, created_at')
    .order('name')

  if (gErr) {
    return NextResponse.json({ error: gErr.message }, { status: 500 })
  }

  const ids = (groups ?? []).map((g) => g.group_id)
  if (ids.length === 0) {
    return NextResponse.json({ groups: [] })
  }

  const { data: permRows, error: pErr } = await supabase
    .from('group_menu_permissions')
    .select(
      'group_id, menu_key, can_read, can_create, can_update, can_delete'
    )
    .in('group_id', ids)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  const byGroup = new Map<string, typeof permRows>()
  for (const row of permRows ?? []) {
    const list = byGroup.get(row.group_id) ?? []
    list.push(row)
    byGroup.set(row.group_id, list)
  }

  const result = (groups ?? []).map((g) => ({
    ...g,
    permissions: permissionsFromDbRows(byGroup.get(g.group_id) ?? []),
  }))

  return NextResponse.json({ groups: result })
}

export async function POST(request: Request) {
  const gate = await requirePermission('user_groups', 'create')
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
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

  const name = body.name?.trim() ?? ''
  if (!name) {
    return NextResponse.json({ error: 'Nama grup wajib diisi.' }, { status: 400 })
  }

  const description =
    body.description === undefined || body.description === null
      ? null
      : String(body.description).trim() || null

  const permMap = parsePermissionsBody(body.permissions)

  const { data: inserted, error: insErr } = await supabase
    .from('user_groups')
    .insert({ name, description })
    .select('group_id')
    .single()

  if (insErr) {
    const code = insErr.code === '23505' ? 409 : 500
    return NextResponse.json({ error: insErr.message }, { status: code })
  }

  const groupId = inserted.group_id
  const rows = dbRowsFromPermissionsMap(groupId, permMap)
  const { error: permErr } = await supabase
    .from('group_menu_permissions')
    .insert(rows)

  if (permErr) {
    await supabase.from('user_groups').delete().eq('group_id', groupId)
    return NextResponse.json({ error: permErr.message }, { status: 500 })
  }

  return NextResponse.json({ group_id: groupId })
}
