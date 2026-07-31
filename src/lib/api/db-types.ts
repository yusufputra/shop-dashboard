export type DbFilter =
  | { op: 'eq'; column: string; value: unknown }
  | { op: 'gt'; column: string; value: unknown }
  | { op: 'gte'; column: string; value: unknown }
  | { op: 'lte'; column: string; value: unknown }
  | { op: 'in'; column: string; value: unknown[] }
  | { op: 'ilike'; column: string; value: string }
  | { op: 'is'; column: string; value: null }
  | { op: 'or'; expression: string }
  | { op: 'match'; match: Record<string, unknown> }

export type DbOrder = {
  column: string
  ascending: boolean
}

export type DbSelectMode = 'many' | 'single' | 'maybeSingle'

export type DbSelectRequest = {
  table: string
  select: string
  filters?: DbFilter[]
  order?: DbOrder
  limit?: number
  /** Inclusive range, PostgREST-style (from/to). */
  range?: { from: number; to: number }
  count?: 'exact'
  /** When true with count, return only the count (no rows). */
  head?: boolean
  mode?: DbSelectMode
}

export type DbInsertRequest = {
  table: string
  rows: Record<string, unknown> | Record<string, unknown>[]
}

export type DbUpdateRequest = {
  table: string
  data: Record<string, unknown>
  filters: DbFilter[]
}

export type DbDeleteRequest = {
  table: string
  filters: DbFilter[]
}

export type DbError = {
  message: string
  code?: string
}

export type DbSelectResponse = {
  data: unknown
  count?: number | null
  error: DbError | null
}

export type DbMutationResponse = {
  data?: unknown
  error: DbError | null
}
