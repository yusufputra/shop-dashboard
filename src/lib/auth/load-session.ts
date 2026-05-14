import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  MENU_KEYS,
  emptyPermissions,
  fullPermissions,
  type MenuKey,
  type PermissionsMap,
} from '@/lib/auth/permissions'

type LoginAuthRow = {
  user_id: string
  group_id: string | null
  is_superuser: boolean | null
}

export type LoadedAuthFields = {
  groupIds: string[]
  groupNames: string[]
  isSuperuser: boolean
  permissions: PermissionsMap
}

function mergePermissionRows(
  permRows: {
    menu_key: string
    can_read: boolean
    can_create: boolean
    can_update: boolean
    can_delete: boolean
  }[]
): PermissionsMap {
  const map = emptyPermissions()
  for (const row of permRows) {
    const key = row.menu_key as string
    if (!MENU_KEYS.includes(key as MenuKey)) continue
    const k = key as MenuKey
    map[k] = {
      read: map[k].read || Boolean(row.can_read),
      create: map[k].create || Boolean(row.can_create),
      update: map[k].update || Boolean(row.can_update),
      delete: map[k].delete || Boolean(row.can_delete),
    }
  }
  return map
}

export async function loadAuthForLoginRow(
  supabase: SupabaseClient,
  row: LoginAuthRow
): Promise<LoadedAuthFields> {
  const junction = await supabase
    .from('login_user_groups')
    .select('group_id, user_groups(name)')
    .eq('user_id', row.user_id)

  type JRow = {
    group_id: string
    user_groups: { name: string } | null
  }

  let groupIds = ((junction.data ?? []) as unknown as JRow[]).map((m) => m.group_id)
  let groupNames = ((junction.data ?? []) as unknown as JRow[])
    .map((m) => m.user_groups?.name)
    .filter((n): n is string => Boolean(n))

  if (groupIds.length === 0 && row.group_id) {
    groupIds = [row.group_id]
    const { data: g } = await supabase
      .from('user_groups')
      .select('name')
      .eq('group_id', row.group_id)
      .maybeSingle()
    groupNames = g?.name ? [g.name] : []
  }

  if (row.is_superuser) {
    return {
      groupIds,
      groupNames,
      isSuperuser: true,
      permissions: fullPermissions(),
    }
  }

  if (groupIds.length === 0) {
    return {
      groupIds: [],
      groupNames: [],
      isSuperuser: false,
      permissions: emptyPermissions(),
    }
  }

  const { data: permRows } = await supabase
    .from('group_menu_permissions')
    .select('menu_key, can_read, can_create, can_update, can_delete')
    .in('group_id', groupIds)

  return {
    groupIds,
    groupNames,
    isSuperuser: false,
    permissions: mergePermissionRows(permRows ?? []),
  }
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
