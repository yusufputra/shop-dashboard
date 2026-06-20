import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/auth/load-session'
import { requireAnyPermission } from '@/lib/auth/require-api-permission'
import {
  permissionAlternatives,
  tableMenus,
} from '@/lib/api/table-permissions'
import { executeUpdate } from '@/lib/api/db-server'
import type { DbUpdateRequest } from '@/lib/api/db-types'

export async function POST(request: Request) {
  let body: DbUpdateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const table = body.table?.trim()
  if (!table || !body.data || !Array.isArray(body.filters)) {
    return NextResponse.json({ error: 'Permintaan tidak lengkap' }, { status: 400 })
  }

  const menus = tableMenus(table)
  if (!menus) {
    return NextResponse.json({ error: 'Tabel tidak diizinkan' }, { status: 403 })
  }

  const gate = await requireAnyPermission(permissionAlternatives(menus, 'update'))
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server tidak dikonfigurasi' }, { status: 500 })
  }

  const result = await executeUpdate(supabase, body)
  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
