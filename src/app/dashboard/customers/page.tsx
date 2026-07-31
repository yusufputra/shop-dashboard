'use client'

import { alertDialog } from '@/lib/desktop/dialogs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { customerPublicIdPath } from '@/lib/customers/public-id'
import { computeAvailablePoints, displayPoints } from '@/lib/customers/points'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import type { Customer, CustomerPointLedger, CustomerPointRedeem } from '@/types/database'
import { TablePagination } from '@/components/table-pagination'
import {
  DEFAULT_PAGE_SIZE,
  FETCH_PAGE_SIZE,
  pageRange,
  sanitizeSearchTerm,
  searchOrExpression,
  type PageSize,
} from '@/lib/pagination'
import type { DbProxyClient } from '@/lib/api/db-client'

async function fetchRowsForCustomerIds(
  supabase: DbProxyClient,
  table: 'customer_point_ledger' | 'customer_point_redeem',
  customerIds: string[],
  options?: { expiresAfter?: string }
) {
  if (customerIds.length === 0) return [] as Record<string, unknown>[]

  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < customerIds.length; i += FETCH_PAGE_SIZE) {
    const idChunk = customerIds.slice(i, i + FETCH_PAGE_SIZE)
    let from = 0
    while (true) {
      let query = supabase
        .from(table)
        .select('*')
        .in('customer_id', idChunk)

      if (options?.expiresAfter) {
        query = query.gt('expires_at', options.expiresAfter)
      }

      const { data, error } = await query.range(from, from + FETCH_PAGE_SIZE - 1)
      if (error) throw error
      if (!data?.length) break
      rows.push(...data)
      if (data.length < FETCH_PAGE_SIZE) break
      from += FETCH_PAGE_SIZE
    }
  }
  return rows
}

export default function CustomersPage() {
  useRoutePermissionGuard('customers', 'read')
  const { can } = useDashboardAuth()
  const supabase = useMemo(() => createClient(), [])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pointsByCustomer, setPointsByCustomer] = useState<Map<string, number>>(new Map())
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(0)
  }, [debouncedSearch])

  const applySearch = useCallback(
    <T extends { or: (expression: string) => T }>(query: T) => {
      const term = sanitizeSearchTerm(debouncedSearch)
      if (!term) return query
      return query.or(
        searchOrExpression(['nama', 'public_id', 'phone'], term)
      )
    },
    [debouncedSearch]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = pageRange(page, pageSize)
      const { data, error, count } = await applySearch(
        supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .order('nama')
      ).range(from, to)

      if (error) throw error

      const pageCustomers = (data as Customer[]) ?? []
      setCustomers(pageCustomers)
      setTotalCount(count ?? 0)

      const customerIds = pageCustomers.map((c) => c.customer_id)
      const nowIso = new Date().toISOString()
      const [ledgerRows, redeemRows] = await Promise.all([
        fetchRowsForCustomerIds(supabase, 'customer_point_ledger', customerIds, {
          expiresAfter: nowIso,
        }),
        fetchRowsForCustomerIds(supabase, 'customer_point_redeem', customerIds),
      ])

      const ledgerByCustomer = new Map<string, CustomerPointLedger[]>()
      const redeemByCustomer = new Map<string, CustomerPointRedeem[]>()

      for (const row of ledgerRows as unknown as CustomerPointLedger[]) {
        const list = ledgerByCustomer.get(row.customer_id) ?? []
        list.push(row)
        ledgerByCustomer.set(row.customer_id, list)
      }
      for (const row of redeemRows as unknown as CustomerPointRedeem[]) {
        const list = redeemByCustomer.get(row.customer_id) ?? []
        list.push(row)
        redeemByCustomer.set(row.customer_id, list)
      }

      const points = new Map<string, number>()
      for (const c of pageCustomers) {
        points.set(
          c.customer_id,
          computeAvailablePoints(
            ledgerByCustomer.get(c.customer_id) ?? [],
            redeemByCustomer.get(c.customer_id) ?? []
          )
        )
      }
      setPointsByCustomer(points)
    } catch (e) {
      console.error(e)
      await alertDialog('Gagal memuat data pelanggan')
    } finally {
      setLoading(false)
    }
  }, [supabase, applySearch, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && customers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pelanggan & poin</h1>
          <p className="text-gray-600">
            Nomor pelanggan unik per orang. Poin aktif = jurnal belum kedaluwarsa dikurangi total redeem.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('point_redeem', 'read') && (
            <Link
              href="/dashboard/customers/redeem"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-amber-800 shadow-sm transition-all hover:bg-amber-50"
            >
              <span>Redeem poin</span>
            </Link>
          )}
          {can('customers', 'create') && (
            <Link
              href="/dashboard/customers/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah pelanggan</span>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, nomor pelanggan, atau telepon..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-700">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-700">
                  Nomor pelanggan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-700">
                  Kontak
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-700">
                  Poin aktif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {totalCount === 0 && !sanitizeSearchTerm(debouncedSearch) ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Belum ada pelanggan. {can('customers', 'create') ? 'Klik Tambah pelanggan.' : ''}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada pelanggan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const pid = String(c.public_id)
                  const pts = pointsByCustomer.get(c.customer_id) ?? 0
                  return (
                    <tr key={c.customer_id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <Link
                          href={`/dashboard/customers/${customerPublicIdPath(pid)}`}
                          className="text-amber-700 hover:underline"
                        >
                          {c.nama}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-800">{pid}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-amber-700">
                        {displayPoints(pts)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  )
}
