'use client'

import { alertDialog, confirmDialog } from '@/lib/desktop/dialogs'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import { formatCreatedByLabel } from '@/lib/audit/created-by'
import { formatCurrency, formatWeight } from '@/lib/utils'
import Link from 'next/link'
import { useDashboardAuth } from '@/app/dashboard/dashboard-auth-context'
import { TablePagination } from '@/components/table-pagination'
import {
  DEFAULT_PAGE_SIZE,
  pageRange,
  sanitizeSearchTerm,
  searchOrExpression,
  sumNumericFields,
  type PageSize,
} from '@/lib/pagination'

interface SaleWithStock {
  no: string
  tanggal: string
  nama_pembeli: string
  alamat: string
  no_telp: string | null
  harga_jual: number
  biaya: number | null
  created_by_nama: string | null
  stok_seri: string
  perhiasan: string
  jenis: string
  berat: number
}

export default function SalesPage() {
  const { can } = useDashboardAuth()
  const supabase = createClient()
  const [sales, setSales] = useState<SaleWithStock[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(true)

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
        searchOrExpression(['nama_pembeli', 'no', 'stok_seri'], term)
      )
    },
    [debouncedSearch]
  )

  const loadStats = useCallback(async () => {
    try {
      const countResult = await applySearch(
        supabase.from('penjualan_perhiasan').select('*', { count: 'exact', head: true })
      )
      if (countResult.error) throw countResult.error

      const sums = await sumNumericFields(
        (from, to) =>
          applySearch(
            supabase.from('penjualan_perhiasan').select('harga_jual')
          ).range(from, to),
        ['harga_jual']
      )

      setTotalCount(countResult.count ?? 0)
      setTotalRevenue(sums.harga_jual)
    } catch (error) {
      console.error('Error loading sales stats:', error)
    }
  }, [supabase, applySearch])

  const loadSales = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = pageRange(page, pageSize)
      const { data, error, count } = await applySearch(
        supabase
          .from('penjualan_perhiasan')
          .select(`
            *,
            stok_perhiasan!inner(perhiasan, jenis, berat)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
      ).range(from, to)

      if (error) throw error

      const formattedData =
        data?.map((item) => ({
          ...item,
          perhiasan: item.stok_perhiasan.perhiasan,
          jenis: item.stok_perhiasan.jenis,
          berat: item.stok_perhiasan.berat,
        })) || []

      setSales(formattedData)
      if (count != null) setTotalCount(count)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, applySearch, page, pageSize])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const handleDelete = async (no: string, stokSeri: string) => {
    if (!await confirmDialog('Apakah Anda yakin ingin menghapus data penjualan ini?')) return

    try {
      if (stokSeri) {
        const { error: stockError } = await supabase
          .from('stok_perhiasan')
          .update({ status: 'available' })
          .eq('seri', stokSeri)

        if (stockError) throw stockError
      }

      const { error } = await supabase
        .from('penjualan_perhiasan')
        .delete()
        .eq('no', no)

      if (error) throw error
      await Promise.all([loadSales(), loadStats()])
    } catch (error) {
      console.error('Error deleting sale:', error)
      await alertDialog('Gagal menghapus data penjualan')
    }
  }

  if (loading && sales.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Penjualan Perhiasan</h1>
          <p className="text-gray-600">Jual stok perhiasan ke pelanggan</p>
        </div>
        {can('sales', 'create') && (
          <Link
            href="/dashboard/sales/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Penjualan</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, no penjualan, atau seri stok..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Penjualan</p>
          <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">No</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Pembeli</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Seri Stok</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Item</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Biaya</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Harga Jual</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Dibuat oleh</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data penjualan
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
                  <tr key={item.no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_pembeli}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stok_seri}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{item.perhiasan} - {item.jenis}</div>
                      <div className="text-xs text-gray-500">{formatWeight(Number(item.berat))}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.biaya ? formatCurrency(Number(item.biaya)) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-600">
                      {formatCurrency(Number(item.harga_jual))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCreatedByLabel(item.created_by_nama)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/dashboard/sales/${item.no}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {can('sales', 'delete') && (
                          <button
                            onClick={() => handleDelete(item.no, item.stok_seri)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 className="w-5 h-5" />
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
