import { NextResponse } from 'next/server'
import { requireAnyPermission } from '@/lib/auth/require-api-permission'
import { createServiceRoleClient } from '@/lib/auth/load-session'

export async function GET() {
  const gate = await requireAnyPermission([
    { menu: 'users', action: 'read' },
    { menu: 'user_groups', action: 'read' },
  ])
  if (!gate.ok) return gate.response

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server tidak dikonfigurasi' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('user_groups')
    .select('group_id, name, description')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ groups: data ?? [] })
}
