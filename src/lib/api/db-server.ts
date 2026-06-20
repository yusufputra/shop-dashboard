import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DbDeleteRequest,
  DbFilter,
  DbInsertRequest,
  DbMutationResponse,
  DbSelectRequest,
  DbSelectResponse,
  DbUpdateRequest,
} from '@/lib/api/db-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: DbFilter[] | undefined): any {
  if (!filters?.length) return query
  let q = query
  for (const filter of filters) {
    if (filter.op === 'eq') {
      q = q.eq(filter.column, filter.value)
    } else if (filter.op === 'gt') {
      q = q.gt(filter.column, filter.value)
    } else if (filter.op === 'gte') {
      q = q.gte(filter.column, filter.value)
    } else if (filter.op === 'lte') {
      q = q.lte(filter.column, filter.value)
    } else if (filter.op === 'in') {
      q = q.in(filter.column, filter.value)
    } else if (filter.op === 'match') {
      for (const [column, value] of Object.entries(filter.match)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const range = value as Record<string, unknown>
          if ('gte' in range) q = q.gte(column, range.gte)
          if ('lte' in range) q = q.lte(column, range.lte)
          if ('gt' in range) q = q.gt(column, range.gt)
          if ('lt' in range) q = q.lt(column, range.lt)
        } else {
          q = q.eq(column, value)
        }
      }
    }
  }
  return q
}

function toDbError(error: { message: string; code?: string } | null) {
  if (!error) return null
  return { message: error.message, code: error.code }
}

export async function executeSelect(
  supabase: SupabaseClient,
  request: DbSelectRequest
): Promise<DbSelectResponse> {
  const mode = request.mode ?? 'many'
  const selectOpts = request.count === 'exact' ? ({ count: 'exact' as const, head: false }) : undefined

  let query = supabase.from(request.table).select(request.select, selectOpts)
  query = applyFilters(query, request.filters)

  if (request.order) {
    query = query.order(request.order.column, {
      ascending: request.order.ascending,
    })
  }

  if (request.limit != null) {
    query = query.limit(request.limit)
  }

  if (mode === 'single') {
    const result = await query.single()
    return {
      data: result.data,
      count: result.count ?? null,
      error: toDbError(result.error),
    }
  }

  if (mode === 'maybeSingle') {
    const result = await query.maybeSingle()
    return {
      data: result.data,
      count: result.count ?? null,
      error: toDbError(result.error),
    }
  }

  const result = await query
  return {
    data: result.data,
    count: result.count ?? null,
    error: toDbError(result.error),
  }
}

export async function executeInsert(
  supabase: SupabaseClient,
  request: DbInsertRequest
): Promise<DbMutationResponse> {
  const rows = Array.isArray(request.rows) ? request.rows : [request.rows]
  const result = await supabase.from(request.table).insert(rows)
  return { error: toDbError(result.error) }
}

export async function executeUpdate(
  supabase: SupabaseClient,
  request: DbUpdateRequest
): Promise<DbMutationResponse> {
  let query = supabase.from(request.table).update(request.data)
  query = applyFilters(query, request.filters)
  const result = await query
  return { error: toDbError(result.error) }
}

export async function executeDelete(
  supabase: SupabaseClient,
  request: DbDeleteRequest
): Promise<DbMutationResponse> {
  let query = supabase.from(request.table).delete()
  query = applyFilters(query, request.filters)
  const result = await query
  return { error: toDbError(result.error) }
}

export function storagePublicUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!base) return ''
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}
