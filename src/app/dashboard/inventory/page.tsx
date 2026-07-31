'use client'

import { alertDialog, confirmDialog } from '@/lib/desktop/dialogs'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download } from 'lucide-react'
import { formatCreatedByLabel } from '@/lib/audit/created-by'
import { warnaLabel, WARNA_OPTIONS } from '@/lib/warna-options'
import { PERHIASAN_OPTIONS } from '@/lib/perhiasan-options'
import { formatCurrency, formatWeight, KADAR_K_OPTIONS } from '@/lib/utils'
import { StokPerhiasan } from '@/types/database'
import Link from 'next/link'
import { useDashboardAuth } from '@/app/dashboard/dashboard-auth-context'
import { DateFilterInput } from '@/components/date-filter-input'
import { TablePagination } from '@/components/table-pagination'
import * as XLSX from 'xlsx'
import type { DbProxyClient } from '@/lib/api/db-client'
import {
  DEFAULT_PAGE_SIZE,
  FETCH_PAGE_SIZE,
  pageRange,
  sanitizeSearchTerm,
  searchOrExpression,
  type PageSize,
} from '@/lib/pagination'

interface StokWithPurchase extends StokPerhiasan {
  sale_date?: string | null
}

type InventoryStats = {
  total: number
  available: number
  sold: number
  beratMasuk: number
  beratKeluar: number
  totalNilai: number
}

type StockQuery = ReturnType<ReturnType<DbProxyClient['from']>['select']>

function applyStockFilters(
  query: StockQuery,
  opts: {
    searchTerm: string
    filterTanggalMasuk: string
    filterStatus: string
    filterKadar: string
    filterWarna: string
    filterPerhiasan: string
    filterKodePabrik: string
    seriIn: string[] | null
  }
) {
  let q = query
  const term = sanitizeSearchTerm(opts.searchTerm)
  if (term) {
    q = q.or(
      searchOrExpression(
        ['seri', 'jenis', 'model', 'perhiasan', 'fyen', 'kode_pabrik'],
        term
      )
    )
  }
  if (opts.filterTanggalMasuk) {
    q = q.eq('tanggal', opts.filterTanggalMasuk)
  }
  if (opts.filterStatus) {
    q = q.eq('status', opts.filterStatus)
  }
  if (opts.filterKadar) {
    q = q.eq('jenis', opts.filterKadar)
  }
  if (opts.filterWarna) {
    q = q.eq('warna', opts.filterWarna)
  }
  if (opts.filterPerhiasan) {
    q = q.eq('perhiasan', opts.filterPerhiasan)
  }
  if (opts.filterKodePabrik) {
    q = q.eq('kode_pabrik', opts.filterKodePabrik)
  }
  if (opts.seriIn) {
    if (opts.seriIn.length === 0) {
      q = q.eq('seri', '__no_match__')
    } else {
      q = q.in('seri', opts.seriIn)
    }
  }
  return q
}

async function fetchSerisBySaleDate(
  supabase: DbProxyClient,
  tanggalKeluar: string
): Promise<string[]> {
  const seris: string[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('penjualan_perhiasan')
      .select('stok_seri')
      .eq('tanggal', tanggalKeluar)
      .range(from, from + FETCH_PAGE_SIZE - 1)

    if (error) throw error
    if (!data?.length) break
    for (const row of data) {
      if (row.stok_seri) seris.push(String(row.stok_seri))
    }
    if (data.length < FETCH_PAGE_SIZE) break
    from += FETCH_PAGE_SIZE
  }
  return seris
}

async function fetchAllMatchingStock(
  supabase: DbProxyClient,
  filterOpts: Parameters<typeof applyStockFilters>[1]
): Promise<StokPerhiasan[]> {
  const rows: StokPerhiasan[] = []
  let from = 0
  while (true) {
    const { data, error } = await applyStockFilters(
      supabase
        .from('stok_perhiasan')
        .select('*')
        .order('created_at', { ascending: false }),
      filterOpts
    ).range(from, from + FETCH_PAGE_SIZE - 1)

    if (error) throw error
    if (!data?.length) break
    rows.push(...(data as StokPerhiasan[]))
    if (data.length < FETCH_PAGE_SIZE) break
    from += FETCH_PAGE_SIZE
  }
  return rows
}

export default function InventoryPage() {
  const { can } = useDashboardAuth()
  const [inventory, setInventory] = useState<StokWithPurchase[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    available: 0,
    sold: 0,
    beratMasuk: 0,
    beratKeluar: 0,
    totalNilai: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterTanggalMasuk, setFilterTanggalMasuk] = useState('')
  const [filterTanggalKeluar, setFilterTanggalKeluar] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKadar, setFilterKadar] = useState('')
  const [filterWarna, setFilterWarna] = useState('')
  const [filterPerhiasan, setFilterPerhiasan] = useState('')
  const [filterKodePabrik, setFilterKodePabrik] = useState('')
  const [kodePabrikOptions, setKodePabrikOptions] = useState<string[]>([])
  const supabase = createClient()

  const kadarOptions = useMemo(() => {
    return [...KADAR_K_OPTIONS].sort((a, b) => {
      const numA = parseInt(a, 10)
      const numB = parseInt(b, 10)
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(0)
  }, [
    debouncedSearch,
    filterTanggalMasuk,
    filterTanggalKeluar,
    filterStatus,
    filterKadar,
    filterWarna,
    filterPerhiasan,
    filterKodePabrik,
  ])

  const loadKodePabrikOptions = useCallback(async () => {
    try {
      const values = new Set<string>()
      let from = 0
      while (true) {
        const { data, error } = await supabase
          .from('stok_perhiasan')
          .select('kode_pabrik')
          .range(from, from + FETCH_PAGE_SIZE - 1)

        if (error) throw error
        if (!data?.length) break
        for (const row of data) {
          const kode = String(row.kode_pabrik ?? '').trim()
          if (kode) values.add(kode)
        }
        if (data.length < FETCH_PAGE_SIZE) break
        from += FETCH_PAGE_SIZE
      }
      setKodePabrikOptions([...values].sort((a, b) => a.localeCompare(b)))
    } catch (error) {
      console.error('Error loading kode pabrik options:', error)
    }
  }, [supabase])

  const resolveFilterOpts = useCallback(async () => {
    const seriIn = filterTanggalKeluar
      ? await fetchSerisBySaleDate(supabase, filterTanggalKeluar)
      : null

    return {
      searchTerm: debouncedSearch,
      filterTanggalMasuk,
      filterStatus,
      filterKadar,
      filterWarna,
      filterPerhiasan,
      filterKodePabrik,
      seriIn,
    }
  }, [
    supabase,
    debouncedSearch,
    filterTanggalMasuk,
    filterTanggalKeluar,
    filterStatus,
    filterKadar,
    filterWarna,
    filterPerhiasan,
    filterKodePabrik,
  ])

  const loadStats = useCallback(async () => {
    try {
      const filterOpts = await resolveFilterOpts()

      const countQueries = [
        applyStockFilters(
          supabase.from('stok_perhiasan').select('*', { count: 'exact', head: true }),
          filterOpts
        ),
      ]

      // Status breakdown only when not already narrowed by status filter.
      if (!filterStatus) {
        countQueries.push(
          applyStockFilters(
            supabase.from('stok_perhiasan').select('*', { count: 'exact', head: true }),
            { ...filterOpts, filterStatus: 'available' }
          ),
          applyStockFilters(
            supabase.from('stok_perhiasan').select('*', { count: 'exact', head: true }),
            { ...filterOpts, filterStatus: 'sold' }
          )
        )
      }

      const countResults = await Promise.all(countQueries)
      for (const result of countResults) {
        if (result.error) throw result.error
      }

      const total = countResults[0].count ?? 0
      let available = 0
      let sold = 0
      if (filterStatus === 'available') {
        available = total
      } else if (filterStatus === 'sold') {
        sold = total
      } else {
        available = countResults[1]?.count ?? 0
        sold = countResults[2]?.count ?? 0
      }

      let beratMasuk = 0
      let beratKeluar = 0
      let totalNilai = 0
      let aggFrom = 0
      while (true) {
        const { data: aggRows, error: aggError } = await applyStockFilters(
          supabase.from('stok_perhiasan').select('berat, harga, status'),
          filterOpts
        ).range(aggFrom, aggFrom + FETCH_PAGE_SIZE - 1)

        if (aggError) throw aggError
        if (!aggRows?.length) break

        for (const row of aggRows) {
          const berat = Number(row.berat) || 0
          const harga = Number(row.harga) || 0
          beratMasuk += berat
          totalNilai += harga
          if (row.status === 'sold') beratKeluar += berat
        }

        if (aggRows.length < FETCH_PAGE_SIZE) break
        aggFrom += FETCH_PAGE_SIZE
      }

      setTotalCount(total)
      setStats({
        total,
        available,
        sold,
        beratMasuk,
        beratKeluar,
        totalNilai,
      })
    } catch (error) {
      console.error('Error loading inventory stats:', error)
    }
  }, [supabase, resolveFilterOpts, filterStatus])

  const loadInventory = useCallback(async () => {
    setLoading(true)
    try {
      const filterOpts = await resolveFilterOpts()
      const { from, to } = pageRange(page, pageSize)

      const pageResult = await applyStockFilters(
        supabase
          .from('stok_perhiasan')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false }),
        filterOpts
      ).range(from, to)

      if (pageResult.error) throw pageResult.error

      const stockData = (pageResult.data ?? []) as StokPerhiasan[]
      const soldSeris = stockData
        .filter((item) => item.status === 'sold')
        .map((item) => item.seri)

      let salesMap = new Map<string, string>()
      if (soldSeris.length > 0) {
        const { data: salesData, error: salesError } = await supabase
          .from('penjualan_perhiasan')
          .select('stok_seri, tanggal')
          .in('stok_seri', soldSeris)

        if (salesError) throw salesError
        salesMap = new Map(
          (salesData ?? []).map((s) => [String(s.stok_seri), String(s.tanggal)])
        )
      }

      setInventory(
        stockData.map((item) => ({
          ...item,
          sale_date: item.status === 'sold' ? salesMap.get(item.seri) ?? null : null,
        }))
      )
      if (pageResult.count != null) {
        setTotalCount(pageResult.count)
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, page, pageSize, resolveFilterOpts])

  useEffect(() => {
    loadKodePabrikOptions()
  }, [loadKodePabrikOptions])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  const hasActiveFilters =
    filterTanggalMasuk ||
    filterTanggalKeluar ||
    filterStatus ||
    filterKadar ||
    filterWarna ||
    filterPerhiasan ||
    filterKodePabrik

  function resetFilters() {
    setFilterTanggalMasuk('')
    setFilterTanggalKeluar('')
    setFilterStatus('')
    setFilterKadar('')
    setFilterWarna('')
    setFilterPerhiasan('')
    setFilterKodePabrik('')
  }

  async function exportToExcel() {
    try {
      const seriIn = filterTanggalKeluar
        ? await fetchSerisBySaleDate(supabase, filterTanggalKeluar)
        : null

      const filterOpts = {
        searchTerm: debouncedSearch,
        filterTanggalMasuk,
        filterStatus,
        filterKadar,
        filterWarna,
        filterPerhiasan,
        filterKodePabrik,
        seriIn,
      }

      const allStock = await fetchAllMatchingStock(supabase, filterOpts)
      const soldSeris = allStock
        .filter((item) => item.status === 'sold')
        .map((item) => item.seri)

      const salesMap = new Map<string, string>()
      for (let i = 0; i < soldSeris.length; i += FETCH_PAGE_SIZE) {
        const chunk = soldSeris.slice(i, i + FETCH_PAGE_SIZE)
        if (chunk.length === 0) continue
        const { data: salesData, error } = await supabase
          .from('penjualan_perhiasan')
          .select('stok_seri, tanggal')
          .in('stok_seri', chunk)
        if (error) throw error
        for (const s of salesData ?? []) {
          salesMap.set(String(s.stok_seri), String(s.tanggal))
        }
      }

      const exportData = allStock.map((item) => {
        const saleDate = item.status === 'sold' ? salesMap.get(item.seri) : null
        return {
          Seri: item.seri,
          'Tanggal Masuk': new Date(item.tanggal).toLocaleDateString('id-ID'),
          'Tanggal Keluar': saleDate
            ? new Date(saleDate).toLocaleDateString('id-ID')
            : '',
          Status: item.status === 'sold' ? 'Terjual' : 'Tersedia',
          Kadar: item.jenis,
          Warna: item.warna ? warnaLabel(item.warna) : '',
          Perhiasan: item.perhiasan,
          'Kode Pabrik': item.kode_pabrik?.trim() ?? '',
          Model: item.model,
          Fyen: item.fyen?.trim() ?? '',
          Berat: Number(item.berat),
          Harga: Number(item.harga),
          'Dibuat oleh': formatCreatedByLabel(item.created_by_nama),
        }
      })

      const summary = [
        {},
        { Seri: 'RINGKASAN' },
        { Seri: 'Total Item', Harga: allStock.length },
        {
          Seri: 'Tersedia',
          Harga: allStock.filter((item) => item.status === 'available').length,
        },
        {
          Seri: 'Terjual',
          Harga: allStock.filter((item) => item.status === 'sold').length,
        },
        {
          Seri: 'Total Berat',
          Berat: allStock.reduce((sum, item) => sum + Number(item.berat), 0),
        },
        {
          Seri: 'Total Nilai',
          Harga: allStock.reduce((sum, item) => sum + Number(item.harga), 0),
        },
      ]

      const ws = XLSX.utils.json_to_sheet([...exportData, ...summary])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Stok Perhiasan')

      const dateStamp = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `stok-perhiasan-${dateStamp}.xlsx`)
    } catch (error) {
      console.error('Error exporting inventory:', error)
      await alertDialog('Gagal mengekspor data')
    }
  }

  async function handleDelete(seri: string) {
    if (!await confirmDialog('Apakah Anda yakin ingin menghapus data ini?')) return

    try {
      const { error } = await supabase
        .from('stok_perhiasan')
        .delete()
        .eq('seri', seri)

      if (error) throw error
      await Promise.all([loadInventory(), loadStats(), loadKodePabrikOptions()])
    } catch (error) {
      console.error('Error deleting item:', error)
      await alertDialog('Gagal menghapus data')
    }
  }

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Perhiasan</h1>
          <p className="text-gray-600">Kelola data inventori perhiasan</p>
        </div>
        {can('inventory', 'create') && (
          <Link
            href="/dashboard/inventory/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Stok</span>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan seri, jenis, model, atau perhiasan..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}</span>
          </button>
          <button
            onClick={exportToExcel}
            disabled={totalCount === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <DateFilterInput
              label="Filter Tanggal Masuk"
              value={filterTanggalMasuk}
              onChange={setFilterTanggalMasuk}
            />
            <DateFilterInput
              label="Filter Tanggal Keluar (Penjualan)"
              value={filterTanggalKeluar}
              onChange={setFilterTanggalKeluar}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black bg-white"
              >
                <option value="">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="sold">Terjual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kadar
              </label>
              <select
                value={filterKadar}
                onChange={(e) => setFilterKadar(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black bg-white"
              >
                <option value="">Semua Kadar</option>
                {kadarOptions.map((kadar) => (
                  <option key={kadar} value={kadar}>{kadar}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Warna
              </label>
              <select
                value={filterWarna}
                onChange={(e) => setFilterWarna(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black bg-white"
              >
                <option value="">Semua Warna</option>
                {WARNA_OPTIONS.map((warna) => (
                  <option key={warna.value} value={warna.value}>{warna.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Perhiasan
              </label>
              <select
                value={filterPerhiasan}
                onChange={(e) => setFilterPerhiasan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black bg-white"
              >
                <option value="">Semua Perhiasan</option>
                {PERHIASAN_OPTIONS.map((perhiasan) => (
                  <option key={perhiasan} value={perhiasan}>{perhiasan}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kode Pabrik
              </label>
              <select
                value={filterKodePabrik}
                onChange={(e) => setFilterKodePabrik(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black bg-white"
              >
                <option value="">Semua Kode Pabrik</option>
                {kodePabrikOptions.map((kode) => (
                  <option key={kode} value={kode}>{kode}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="md:col-span-2 lg:col-span-3">
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Item</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Tersedia</p>
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Terjual</p>
          <p className="text-3xl font-bold text-red-600">{stats.sold}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Berat Masuk</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatWeight(stats.beratMasuk)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Berat Keluar</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatWeight(stats.beratKeluar)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalNilai)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Seri
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Tanggal Masuk
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Tanggal Keluar
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Kadar
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Warna
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Perhiasan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Kode pabrik
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Fyen
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Berat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Dibuat oleh
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data stok perhiasan
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.seri} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.seri}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sale_date ? (
                        <span className="text-gray-900">
                          {new Date(item.sale_date).toLocaleDateString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.status === 'sold' ? (
                        <div className="space-y-1">
                          <span className="px-2 py-1 bg-red-100 text-red-900 rounded-full text-xs font-medium">
                            Terjual
                          </span>
                          {item.pembelian_seri && (
                            <div className="text-xs text-gray-600">
                              Ref: {item.pembelian_seri}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-900 rounded-full text-xs font-medium">
                          Tersedia
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-medium">
                        {item.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.warna ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.warna === 'kuning' ? 'bg-yellow-100 text-yellow-900' :
                          item.warna === 'rosegold' ? 'bg-pink-100 text-pink-900' :
                          item.warna === 'putih' ? 'bg-gray-100 text-gray-900' :
                          item.warna === 'hitam' ? 'bg-gray-800 text-white' :
                          item.warna === 'merah' ? 'bg-red-100 text-red-900' :
                          item.warna === 'variasi' ? 'bg-purple-100 text-purple-900' :
                          'bg-gray-100 text-gray-900'
                        }`}>
                          {warnaLabel(item.warna)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.perhiasan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.kode_pabrik?.trim() || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.fyen?.trim() || '—'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/inventory/${item.seri}`}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Link>
                        {can('inventory', 'update') && (
                          <Link
                            href={`/dashboard/inventory/${item.seri}/edit`}
                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-amber-600" />
                          </Link>
                        )}
                        {can('inventory', 'delete') && (
                          <button
                            onClick={() => handleDelete(item.seri)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
