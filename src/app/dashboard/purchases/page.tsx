'use client'

import { alertDialog, confirmDialog } from '@/lib/desktop/dialogs'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { formatCreatedByLabel } from '@/lib/audit/created-by'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { PembelianPerhiasan } from '@/types/database'
import Link from 'next/link'
import { useDashboardAuth } from '@/app/dashboard/dashboard-auth-context'
import { DateRangeFilter } from '@/components/date-range-filter'
import { TablePagination } from '@/components/table-pagination'
import {
  DEFAULT_PAGE_SIZE,
  applyDateRange,
  pageRange,
  sanitizeSearchTerm,
  searchOrExpression,
  sumNumericFields,
  type PageSize,
} from '@/lib/pagination'

export default function PurchasesPage() {
  const { can } = useDashboardAuth()
  const [purchases, setPurchases] = useState<PembelianPerhiasan[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalNilai, setTotalNilai] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE)
  const supabase = createClient()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(0)
  }, [debouncedSearch, startDate, endDate])

  const applySearch = useCallback(
    <T extends {
      or: (expression: string) => T
      gte: (column: string, value: string) => T
      lte: (column: string, value: string) => T
    }>(query: T) => {
      const term = sanitizeSearchTerm(debouncedSearch)
      const withSearch = term
        ? query.or(searchOrExpression(['nama', 'perhiasan', 'seri'], term))
        : query
      return applyDateRange(withSearch, 'tanggal', startDate, endDate)
    },
    [debouncedSearch, startDate, endDate]
  )

  const loadStats = useCallback(async () => {
    try {
      const countResult = await applySearch(
        supabase.from('pembelian_perhiasan').select('*', { count: 'exact', head: true })
      )
      if (countResult.error) throw countResult.error

      const sums = await sumNumericFields(
        (from, to) =>
          applySearch(
            supabase.from('pembelian_perhiasan').select('harga')
          ).range(from, to),
        ['harga']
      )

      setTotalCount(countResult.count ?? 0)
      setTotalNilai(sums.harga)
    } catch (error) {
      console.error('Error loading purchase stats:', error)
    }
  }, [supabase, applySearch])

  const loadPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = pageRange(page, pageSize)
      const { data, error, count } = await applySearch(
        supabase
          .from('pembelian_perhiasan')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
      ).range(from, to)

      if (error) throw error
      setPurchases((data as PembelianPerhiasan[]) || [])
      if (count != null) setTotalCount(count)
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, applySearch, page, pageSize])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  async function handleDelete(seri: string) {
    if (!await confirmDialog('Apakah Anda yakin ingin menghapus data ini?')) return

    try {
      const { error } = await supabase
        .from('pembelian_perhiasan')
        .delete()
        .eq('seri', seri)

      if (error) throw error
      await Promise.all([loadPurchases(), loadStats()])
    } catch (error) {
      console.error('Error deleting purchase:', error)
      await alertDialog('Gagal menghapus data')
    }
  }

  if (loading && purchases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembelian Perhiasan</h1>
          <p className="text-gray-600">Kelola data pembelian dari pelanggan</p>
        </div>
        {can('purchases', 'create') && (
          <Link
            href="/dashboard/purchases/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Pembelian</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, seri, kadar..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
          />
        </div>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Pembelian</p>
          <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalNilai)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Seri</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Nama</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Perhiasan</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Kadar</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Berat</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Harga</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Dibuat oleh</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data pembelian
                  </td>
                </tr>
              ) : (
                purchases.map((item) => (
                  <tr key={item.seri} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.seri}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.perhiasan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.kadar == null ? '—' : `${item.kadar}K`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatWeight(Number(item.berat))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(Number(item.harga))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCreatedByLabel(item.created_by_nama)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/purchases/${item.seri}`}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Link>
                        {can('purchases', 'update') && (
                          <Link
                            href={`/dashboard/purchases/${item.seri}/edit`}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-green-600" />
                          </Link>
                        )}
                        {can('purchases', 'delete') && (
                          <button
                            onClick={() => handleDelete(item.seri)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
