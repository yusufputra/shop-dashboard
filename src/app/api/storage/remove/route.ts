import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/auth/load-session'
import { requireAnyPermission } from '@/lib/auth/require-api-permission'
import {
  permissionAlternatives,
  storageBucketMenus,
} from '@/lib/api/table-permissions'

export async function POST(request: Request) {
  let body: { bucket?: string; paths?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const bucket = body.bucket?.trim()
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === 'string' && p.length > 0)
    : []

  if (!bucket || paths.length === 0) {
    return NextResponse.json({ error: 'Permintaan tidak lengkap' }, { status: 400 })
  }

  const menus = storageBucketMenus(bucket)
  if (!menus) {
    return NextResponse.json({ error: 'Bucket tidak diizinkan' }, { status: 403 })
  }

  const gate = await requireAnyPermission(permissionAlternatives(menus, 'delete'))
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server tidak dikonfigurasi' }, { status: 500 })
  }

  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
