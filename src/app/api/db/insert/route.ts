import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/auth/load-session'
import { requireAnyPermission } from '@/lib/auth/require-api-permission'
import {
  permissionAlternatives,
  tableMenus,
} from '@/lib/api/table-permissions'
import { executeInsert } from '@/lib/api/db-server'
import type { DbInsertRequest } from '@/lib/api/db-types'

export async function POST(request: Request) {
  let body: DbInsertRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const table = body.table?.trim()
  if (!table || body.rows == null) {
    return NextResponse.json({ error: 'Permintaan tidak lengkap' }, { status: 400 })
  }

  const menus = tableMenus(table)
  if (!menus) {
    return NextResponse.json({ error: 'Tabel tidak diizinkan' }, { status: 403 })
  }

  const gate = await requireAnyPermission(permissionAlternatives(menus, 'create'))
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server tidak dikonfigurasi' }, { status: 500 })
  }

  const result = await executeInsert(supabase, body)
  if (result.error) {
    const status = result.error.code === '23505' ? 409 : 500
    return NextResponse.json(result, { status })
  }

  return NextResponse.json(result)
}
