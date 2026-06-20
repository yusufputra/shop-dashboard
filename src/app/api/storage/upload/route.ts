import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/auth/load-session'
import { requireAnyPermission } from '@/lib/auth/require-api-permission'
import {
  permissionAlternatives,
  storageBucketMenus,
} from '@/lib/api/table-permissions'
import { storagePublicUrl } from '@/lib/api/db-server'

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const bucket = String(form.get('bucket') ?? '').trim()
  const path = String(form.get('path') ?? '').trim()
  const file = form.get('file')

  if (!bucket || !path || !(file instanceof File)) {
    return NextResponse.json({ error: 'Permintaan tidak lengkap' }, { status: 400 })
  }

  const menus = storageBucketMenus(bucket)
  if (!menus) {
    return NextResponse.json({ error: 'Bucket tidak diizinkan' }, { status: 403 })
  }

  const gate = await requireAnyPermission([
    ...permissionAlternatives(menus, 'create'),
    ...permissionAlternatives(menus, 'update'),
  ])
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Server tidak dikonfigurasi' }, { status: 500 })
  }

  const upsert = String(form.get('upsert') ?? 'false') === 'true'
  const cacheControl = String(form.get('cacheControl') ?? '3600')

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl,
    upsert,
  })

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }

  return NextResponse.json({
    publicUrl: storagePublicUrl(bucket, path),
  })
}
