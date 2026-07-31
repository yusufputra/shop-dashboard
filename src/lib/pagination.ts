export const PAGE_SIZE_OPTIONS = [50, 100, 500, 1000] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 50

/** PostgREST/Supabase max rows per request — use when chunking background fetches. */
export const FETCH_PAGE_SIZE = 1000

export function sanitizeSearchTerm(term: string) {
  return term.trim().replace(/[%*,()]/g, '')
}

export function searchOrExpression(columns: string[], term: string) {
  const pattern = `%${sanitizeSearchTerm(term)}%`
  return columns.map((column) => `${column}.ilike.${pattern}`).join(',')
}

export function pageRange(page: number, pageSize: number) {
  const from = page * pageSize
  return { from, to: from + pageSize - 1 }
}

type PageResult = {
  data: unknown[] | null
  error: { message: string } | null
}

type PageFetcher = (from: number, to: number) => PromiseLike<PageResult>

/** Sum numeric fields by walking pages of lightweight column selects. */
export async function sumNumericFields(
  fetchPage: PageFetcher,
  fields: string[]
): Promise<Record<string, number>> {
  const totals = Object.fromEntries(fields.map((field) => [field, 0])) as Record<string, number>
  const rows = await fetchAllPages(fetchPage)
  for (const row of rows) {
    const record = row as Record<string, unknown>
    for (const field of fields) {
      totals[field] += Number(record[field]) || 0
    }
  }
  return totals
}

/** Collect all rows via ranged page fetches (avoids silent 1000-row cap). */
export async function fetchAllPages<T = Record<string, unknown>>(
  fetchPage: PageFetcher
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await fetchPage(from, from + FETCH_PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...(data as T[]))
    if (data.length < FETCH_PAGE_SIZE) break
    from += FETCH_PAGE_SIZE
  }

  return rows
}
