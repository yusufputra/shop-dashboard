import type {
  DbDeleteRequest,
  DbError,
  DbFilter,
  DbInsertRequest,
  DbSelectRequest,
  DbUpdateRequest,
} from '@/lib/api/db-types'

type RowRecord = Record<string, unknown>

// PostgREST returns dynamic row shapes; screens cast to their domain types (same as untyped Supabase client).
/* eslint-disable @typescript-eslint/no-explicit-any */
type QueryManyResult = any[] | null
type QueryOneResult = any
type QueryMaybeResult = any | null
/* eslint-enable @typescript-eslint/no-explicit-any */

type SelectResult<TData> = {
  data: TData
  error: DbError | null
  count?: number | null
}

type RawSelectResult = SelectResult<RowRecord | RowRecord[] | null>

function normalizeOneRow(data: RowRecord | RowRecord[] | null): RowRecord | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function normalizeManyRows(data: RowRecord | RowRecord[] | null): RowRecord[] | null {
  if (!data) return null
  return Array.isArray(data) ? data : [data]
}

type MutationResult = {
  error: DbError | null
}

async function postMutation(url: string, body: unknown): Promise<MutationResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    const message =
      typeof json.error === 'string'
        ? json.error
        : json.error?.message ?? 'Permintaan gagal'
    return { error: { message } }
  }
  return { error: json.error ?? null }
}

async function postJson(url: string, body: unknown): Promise<RawSelectResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    const message =
      typeof json.error === 'string'
        ? json.error
        : json.error?.message ?? 'Permintaan gagal'
    return {
      data: null,
      error: { message },
    } satisfies RawSelectResult
  }
  return {
    data: json.data as RowRecord | RowRecord[] | null,
    error: json.error ?? null,
    count: json.count ?? null,
  } satisfies RawSelectResult
}

class SelectQuery<TData = QueryManyResult> implements PromiseLike<SelectResult<TData>> {
  private filters: DbFilter[] = []
  private orderBy?: { column: string; ascending: boolean }
  private limitCount?: number
  private count?: 'exact'
  private mode: 'many' | 'single' | 'maybeSingle' = 'many'

  constructor(
    private table: string,
    private select: string
  ) {}

  eq(column: string, value: unknown): SelectQuery<TData> {
    this.filters.push({ op: 'eq', column, value })
    return this
  }

  gt(column: string, value: unknown): SelectQuery<TData> {
    this.filters.push({ op: 'gt', column, value })
    return this
  }

  in(column: string, value: unknown[]): SelectQuery<TData> {
    this.filters.push({ op: 'in', column, value })
    return this
  }

  match(match: Record<string, unknown>): SelectQuery<TData> {
    this.filters.push({ op: 'match', match })
    return this
  }

  order(column: string, opts?: { ascending?: boolean }): SelectQuery<TData> {
    this.orderBy = { column, ascending: opts?.ascending ?? true }
    return this
  }

  limit(count: number): SelectQuery<TData> {
    this.limitCount = count
    return this
  }

  single(): SelectQuery<QueryOneResult> {
    this.mode = 'single'
    return this as unknown as SelectQuery<QueryOneResult>
  }

  maybeSingle(): SelectQuery<QueryMaybeResult> {
    this.mode = 'maybeSingle'
    return this as unknown as SelectQuery<QueryMaybeResult>
  }

  withCount(count: 'exact'): SelectQuery<TData> {
    this.count = count
    return this
  }

  then<TResult1 = SelectResult<TData>, TResult2 = never>(
    onfulfilled?: ((value: SelectResult<TData>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<SelectResult<TData>> {
    const body: DbSelectRequest = {
      table: this.table,
      select: this.select,
      filters: this.filters,
      order: this.orderBy,
      limit: this.limitCount,
      count: this.count,
      mode: this.mode,
    }
    const raw = await postJson('/api/db/query', body)

    if (this.mode === 'single') {
      const row = normalizeOneRow(raw.data)
      return {
        data: row as TData,
        error: row ? raw.error : raw.error ?? { message: 'Row not found' },
        count: raw.count,
      }
    }

    if (this.mode === 'maybeSingle') {
      return {
        data: normalizeOneRow(raw.data) as TData,
        error: raw.error,
        count: raw.count,
      }
    }

    return {
      data: normalizeManyRows(raw.data) as TData,
      error: raw.error,
      count: raw.count,
    }
  }
}

class InsertQuery implements PromiseLike<MutationResult> {
  constructor(
    private table: string,
    private rows: Record<string, unknown> | Record<string, unknown>[]
  ) {}

  then<TResult1 = MutationResult, TResult2 = never>(
    onfulfilled?: ((value: MutationResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const body: DbInsertRequest = { table: this.table, rows: this.rows }
    return postMutation('/api/db/insert', body).then(onfulfilled, onrejected)
  }
}

class UpdateQuery implements PromiseLike<MutationResult> {
  private filters: DbFilter[] = []

  constructor(
    private table: string,
    private data: Record<string, unknown>
  ) {}

  eq(column: string, value: unknown): this {
    this.filters.push({ op: 'eq', column, value })
    return this
  }

  then<TResult1 = MutationResult, TResult2 = never>(
    onfulfilled?: ((value: MutationResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const body: DbUpdateRequest = {
      table: this.table,
      data: this.data,
      filters: this.filters,
    }
    return postMutation('/api/db/update', body).then(onfulfilled, onrejected)
  }
}

class DeleteQuery implements PromiseLike<MutationResult> {
  private filters: DbFilter[] = []

  constructor(private table: string) {}

  eq(column: string, value: unknown): this {
    this.filters.push({ op: 'eq', column, value })
    return this
  }

  then<TResult1 = MutationResult, TResult2 = never>(
    onfulfilled?: ((value: MutationResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const body: DbDeleteRequest = { table: this.table, filters: this.filters }
    return postMutation('/api/db/delete', body).then(onfulfilled, onrejected)
  }
}

class TableClient {
  constructor(private table: string) {}

  select(columns: string, opts?: { count?: 'exact' }): SelectQuery {
    const q = new SelectQuery(this.table, columns)
    if (opts?.count === 'exact') {
      q.withCount('exact')
    }
    return q
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]): InsertQuery {
    return new InsertQuery(this.table, rows)
  }

  update(data: Record<string, unknown>): UpdateQuery {
    return new UpdateQuery(this.table, data)
  }

  delete(): DeleteQuery {
    return new DeleteQuery(this.table)
  }
}

class StorageBucketClient {
  constructor(private bucket: string) {}

  async upload(
    path: string,
    file: File,
    opts?: { cacheControl?: string; upsert?: boolean }
  ): Promise<{ error: DbError | null }> {
    const form = new FormData()
    form.set('bucket', this.bucket)
    form.set('path', path)
    form.set('file', file)
    if (opts?.cacheControl) form.set('cacheControl', opts.cacheControl)
    if (opts?.upsert != null) form.set('upsert', String(opts.upsert))

    const res = await fetch('/api/storage/upload', { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) {
      return { error: json.error ?? { message: 'Upload gagal' } }
    }
    return { error: null }
  }

  async remove(paths: string[]): Promise<{ error: DbError | null }> {
    const res = await fetch('/api/storage/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: this.bucket, paths }),
    })
    const json = await res.json()
    if (!res.ok) {
      return { error: json.error ?? { message: 'Hapus file gagal' } }
    }
    return { error: null }
  }

  getPublicUrl(path: string): { data: { publicUrl: string } } {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
    const publicUrl = base
      ? `${base}/storage/v1/object/public/${this.bucket}/${path}`
      : ''
    return { data: { publicUrl } }
  }
}

class StorageClient {
  from(bucket: string): StorageBucketClient {
    return new StorageBucketClient(bucket)
  }
}

export type DbProxyClient = {
  from: (table: string) => TableClient
  storage: StorageClient
}

export function createDbClient(): DbProxyClient {
  return {
    from(table: string) {
      return new TableClient(table)
    },
    storage: new StorageClient(),
  }
}
