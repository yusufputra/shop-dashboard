'use client'

import { alertDialog, confirmDialog } from '@/lib/desktop/dialogs'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { formatCreatedByLabel } from '@/lib/audit/created-by'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { GadaiPerhiasan } from '@/types/database'
import Link from 'next/link'
import { useDashboardAuth } from '@/app/dashboard/dashboard-auth-context'
import { gadaiInvoicePath } from '@/lib/gadai/invoice-path'
import { TablePagination } from '@/components/table-pagination'
import {
  DEFAULT_PAGE_SIZE,
  pageRange,
  sanitizeSearchTerm,
  searchOrExpression,
  sumNumericFields,
  type PageSize,
} from '@/lib/pagination'

export default function GadaiPage() {
  const { can } = useDashboardAuth()
  const [items, setItems] = useState<GadaiPerhiasan[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [totalPinjaman, setTotalPinjaman] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE)
  const supabase = createClient()

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
        searchOrExpression(
          ['nama', 'no_invoice', 'perhiasan', 'model', 'nik'],
          term
        )
      )
    },
    [debouncedSearch]
  )

  const loadStats = useCallback(async () => {
    try {
      const [totalResult, activeResult] = await Promise.all([
        applySearch(
          supabase.from('gadai_perhiasan').select('*', { count: 'exact', head: true })
        ),
        applySearch(
          supabase
            .from('gadai_perhiasan')
            .select('*', { count: 'exact', head: true })
            .is('tgl_pelunasan', null)
        ),
      ])
      if (totalResult.error) throw totalResult.error
      if (activeResult.error) throw activeResult.error

      const sums = await sumNumericFields(
        (from, to) =>
          applySearch(
            supabase.from('gadai_perhiasan').select('uang_dipinjam')
          ).range(from, to),
        ['uang_dipinjam']
      )

      setTotalCount(totalResult.count ?? 0)
      setActiveCount(activeResult.count ?? 0)
      setTotalPinjaman(sums.uang_dipinjam)
    } catch (error) {
      console.error('Error loading gadai stats:', error)
    }
  }, [supabase, applySearch])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = pageRange(page, pageSize)
      const { data, error, count } = await applySearch(
        supabase
          .from('gadai_perhiasan')
          .select('*', { count: 'exact' })
          .order('tgl_peminjaman', { ascending: false })
      ).range(from, to)

      if (error) throw error
      setItems((data as GadaiPerhiasan[]) || [])
      if (count != null) setTotalCount(count)
    } catch (error) {
      console.error('Error loading gadai:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, applySearch, page, pageSize])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  async function handleDelete(noInvoice: string) {
    if (!await confirmDialog('Apakah Anda yakin ingin menghapus data gadai ini?')) return

    try {
      const { data: row } = await supabase
        .from('gadai_perhiasan')
        .select('foto_pelunasan')
        .eq('no_invoice', noInvoice)
        .single()

      const { error } = await supabase
        .from('gadai_perhiasan')
        .delete()
        .eq('no_invoice', noInvoice)

      if (error) throw error

      if (row?.foto_pelunasan) {
        const path = row.foto_pelunasan.split('/').slice(-2).join('/')
        await supabase.storage.from('jewelry-images').remove([path])
      }

      await Promise.all([loadItems(), loadStats()])
    } catch (error) {
      console.error('Error deleting gadai:', error)
      await alertDialog('Gagal menghapus data')
    }
  }

  if (loading && items.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Gadai Perhiasan</h1>
          <p className="text-gray-600">Kelola data gadai emas/perhiasan pelanggan</p>
        </div>
        {can('gadai', 'create') && (
          <Link
            href="/dashboard/gadai/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Gadai</span>
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
            placeholder="Cari invoice, nama, NIK, perhiasan, model..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Transaksi</p>
          <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Masih Aktif</p>
          <p className="text-3xl font-bold text-amber-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Uang Dipinjam</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPinjaman)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  No. Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Perhiasan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Kadar
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Berat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Uang Dipinjam
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Total Pelunasan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Tgl Peminjaman
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Dibuat oleh
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data gadai
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const path = gadaiInvoicePath(item.no_invoice)
                  const lunas = Boolean(item.tgl_pelunasan)
                  return (
                    <tr key={item.no_invoice} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.no_invoice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.perhiasan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.kadar == null ? '—' : `${item.kadar}K`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatWeight(Number(item.berat))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(Number(item.uang_dipinjam))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                        {formatCurrency(
                          Number(item.total_pelunasan ?? item.uang_dipinjam + (item.bunga ?? 0))
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.tgl_peminjaman).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lunas ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatCreatedByLabel(item.created_by_nama)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/gadai/${path}`}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Link>
                          {can('gadai', 'update') && (
                            <Link
                              href={`/dashboard/gadai/${path}/edit`}
                              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-amber-600" />
                            </Link>
                          )}
                          {can('gadai', 'delete') && (
                            <button
                              onClick={() => handleDelete(item.no_invoice)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
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
