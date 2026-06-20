import { createServiceRoleClient as createAdminClient } from '@/lib/auth/load-session'

/** Server-only Supabase client using the service role key. */
export function createServiceRoleClient() {
  return createAdminClient()
}
