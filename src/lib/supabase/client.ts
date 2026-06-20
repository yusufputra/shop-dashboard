import { createDbClient, type DbProxyClient } from '@/lib/api/db-client'

let cachedClient: DbProxyClient | null = null

/** Browser-safe DB access via Next.js API proxy (no Supabase anon key). */
export function createClient(): DbProxyClient {
  if (!cachedClient) {
    cachedClient = createDbClient()
  }
  return cachedClient
}
