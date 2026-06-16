'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useDashboardAuth } from '@/app/dashboard/dashboard-auth-context'
import { TrendingUp, Package, ShoppingCart, ClipboardList, DollarSign, Download, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { warnaLabel } from '@/lib/warna-options'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import * as XLSX from 'xlsx'

interface Stats {
  totalInventory: number
  totalPurchases: number
  totalOrders: number
  totalRevenue: number
  totalPurchaseAmount: number
}

interface MonthlyData {
  name: string
  penjualan: number
  pembelian: number
}

type FilterType = 'all' | 'date' | 'month' | 'year'

interface RecapData {
  tanggal: string
  tipe: string
  deskripsi: string
  jumlah: number
}

interface ExportRow {
  tanggal: string
  tipe: string
  nomorTransaksi: string
  nomorPelanggan: string
  nikPelanggan: string
  alamatPelanggan: string
  noHpPelanggan: string
  perhiasan: string
  kodeBarang: string
  model: string
  kodePabrik: string
  warna: string
  kadar: string
  berat: number | null
  ongkos: number | null
  jumlahHarga: number
}

type CustomerJoin = {
  public_id: string
  nik: string | null
  alamat: string | null
  phone: string | null
} | null

function customerExportFields(
  customer: CustomerJoin,
  fallback: { alamat?: string; phone?: string | null }
) {
  return {
    nomorPelanggan: customer?.public_id ?? '',
    nikPelanggan: customer?.nik ?? '',
    alamatPelanggan: customer?.alamat ?? fallback.alamat ?? '',
    noHpPelanggan: customer?.phone ?? fallback.phone ?? '',
  }
}

function formatKadarFromPurchase(kadar: number | null): string {
  return kadar != null ? `${kadar}K` : ''
}

export default function DashboardPage() {
  const { can, ready: authReady } = useDashboardAuth()
  const [stats, setStats] = useState<Stats>({
    totalInventory: 0,
    totalPurchases: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalPurchaseAmount: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [recapData, setRecapData] = useState<RecapData[]>([])
  const [exportRows, setExportRows] = useState<ExportRow[]>([])
  const supabase = createClient()

  const loadMonthlyData = useCallback(async () => {
    try {
      const [salesData, purchasesData, ordersData] = await Promise.all([
        supabase.from('penjualan_perhiasan').select('tanggal, harga_jual'),
        supabase.from('pembelian_perhiasan').select('tanggal, harga'),
        supabase.from('pesanan_perhiasan').select('tanggal, harga')
      ])

      // Process data by month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const monthlyStats: Record<string, { penjualan: number; pembelian: number }> = {}

      // Initialize last 6 months
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${monthNames[date.getMonth()]}`
        monthlyStats[monthKey] = { penjualan: 0, pembelian: 0 }
      }

      // Aggregate sales from penjualan table
      salesData.data?.forEach(sale => {
        const date = new Date(sale.tanggal)
        const monthKey = monthNames[date.getMonth()]
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].penjualan += Number(sale.harga_jual)
        }
      })

      // Add custom orders to penjualan
      ordersData.data?.forEach(order => {
        const date = new Date(order.tanggal)
        const monthKey = monthNames[date.getMonth()]
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].penjualan += Number(order.harga)
        }
      })

      // Aggregate purchases (pembelian - buying gold from customers)
      purchasesData.data?.forEach(purchase => {
        const date = new Date(purchase.tanggal)
        const monthKey = monthNames[date.getMonth()]
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].pembelian += Number(purchase.harga)
        }
      })

      // Convert to array
      const chartData = Object.entries(monthlyStats).map(([name, data]) => ({
        name,
        penjualan: data.penjualan,
        pembelian: data.pembelian
      }))

      setMonthlyData(chartData)
    } catch (error) {
      console.error('Error loading monthly data:', error)
    }
  }, [supabase])

  const loadStatsAndData = useCallback(async () => {
    try {
      // Build date filter
      let dateFilter = {}
      if (filterType === 'date' && selectedDate) {
        dateFilter = { tanggal: selectedDate }
      } else if (filterType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-')
        const startDate = `${year}-${month}-01`
        const endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`
        dateFilter = { tanggal: { gte: startDate, lte: endDate } }
      } else if (filterType === 'year' && selectedYear) {
        const startDate = `${selectedYear}-01-01`
        const endDate = `${selectedYear}-12-31`
        dateFilter = { tanggal: { gte: startDate, lte: endDate } }
      }

      const [inventory, purchases, orders, sales] = await Promise.all([
        supabase.from('stok_perhiasan').select('*', { count: 'exact' }),
        supabase
          .from('pembelian_perhiasan')
          .select('*, customers ( public_id, nik, alamat, phone )')
          .match(dateFilter),
        supabase.from('pesanan_perhiasan').select('*').match(dateFilter),
        supabase
          .from('penjualan_perhiasan')
          .select(`
            *,
            customers ( public_id, nik, alamat, phone ),
            stok_perhiasan ( seri, perhiasan, jenis, model, kode_pabrik, warna, berat )
          `)
          .match(dateFilter)
      ])

      // Calculate total revenue from sales + custom orders
      const salesRevenue = sales.data?.reduce((sum, sale) => sum + Number(sale.harga_jual), 0) || 0
      const totalRevenue = salesRevenue

      // Calculate total purchase amount
      const totalPurchaseAmount = purchases.data?.reduce((sum, purchase) => sum + Number(purchase.harga), 0) || 0

      setStats({
        totalInventory: inventory.count || 0,
        totalPurchases: purchases.data?.length || 0,
        totalOrders: orders.data?.length || 0,
        totalRevenue,
        totalPurchaseAmount
      })

      // Prepare recap data
      const recap: RecapData[] = []
      
      // Add sales
      sales.data?.forEach(sale => {
        recap.push({
          tanggal: sale.tanggal,
          tipe: 'Penjualan',
          deskripsi: `${sale.nama_pembeli} - Seri: ${sale.stok_seri}`,
          jumlah: Number(sale.harga_jual)
        })
      })

      // Add purchases
      purchases.data?.forEach(purchase => {
        recap.push({
          tanggal: purchase.tanggal,
          tipe: 'Pembelian',
          deskripsi: `${purchase.nama} - ${purchase.perhiasan}`,
          jumlah: Number(purchase.harga)
        })
      })

      // Add orders
      orders.data?.forEach(order => {
        recap.push({
          tanggal: order.tanggal,
          tipe: 'Pesanan',
          deskripsi: `${order.nama} - ${order.jenis_perhiasan}`,
          jumlah: Number(order.harga)
        })
      })

      // Sort by date
      recap.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      setRecapData(recap)

      const purchaseSeris = purchases.data?.map(p => p.seri) ?? []
      const relatedStockByPurchase = new Map<string, {
        seri: string
        kode_pabrik: string | null
        warna: string | null
        jenis: string
      }>()

      if (purchaseSeris.length > 0) {
        const { data: relatedStock } = await supabase
          .from('stok_perhiasan')
          .select('seri, pembelian_seri, kode_pabrik, warna, jenis')
          .in('pembelian_seri', purchaseSeris)

        relatedStock?.forEach(item => {
          if (item.pembelian_seri) {
            relatedStockByPurchase.set(item.pembelian_seri, item)
          }
        })
      }

      const rows: ExportRow[] = []

      sales.data?.forEach(sale => {
        const customer = (sale.customers as CustomerJoin) ?? null
        const stok = sale.stok_perhiasan as {
          seri: string
          perhiasan: string
          jenis: string
          model: string
          kode_pabrik: string | null
          warna: string | null
          berat: number
        } | null
        const customerInfo = customerExportFields(customer, {
          alamat: sale.alamat,
          phone: sale.no_telp,
        })

        rows.push({
          tanggal: sale.tanggal,
          tipe: 'Penjualan',
          nomorTransaksi: sale.no,
          ...customerInfo,
          perhiasan: stok?.perhiasan ?? '',
          kodeBarang: stok?.seri ?? sale.stok_seri,
          model: stok?.model ?? '',
          kodePabrik: stok?.kode_pabrik?.trim() ?? '',
          warna: stok?.warna ? warnaLabel(stok.warna) : '',
          kadar: stok?.jenis ?? '',
          berat: stok?.berat ?? null,
          ongkos: sale.biaya != null ? Number(sale.biaya) : null,
          jumlahHarga: Number(sale.harga_jual),
        })
      })

      purchases.data?.forEach(purchase => {
        const customer = (purchase.customers as CustomerJoin) ?? null
        const relatedStock = relatedStockByPurchase.get(purchase.seri)
        const customerInfo = customerExportFields(customer, {
          alamat: purchase.alamat,
        })

        rows.push({
          tanggal: purchase.tanggal,
          tipe: 'Pembelian',
          nomorTransaksi: purchase.seri,
          ...customerInfo,
          perhiasan: purchase.perhiasan,
          kodeBarang: relatedStock?.seri ?? '',
          model: purchase.model,
          kodePabrik: relatedStock?.kode_pabrik?.trim() ?? '',
          warna: relatedStock?.warna ? warnaLabel(relatedStock.warna) : '',
          kadar: relatedStock?.jenis ?? formatKadarFromPurchase(purchase.kadar),
          berat: Number(purchase.berat),
          ongkos: null,
          jumlahHarga: Number(purchase.harga),
        })
      })

      rows.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      setExportRows(rows)

      // Load monthly data
      await loadMonthlyData()
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, loadMonthlyData, filterType, selectedDate, selectedMonth, selectedYear])

  useEffect(() => {
    loadStatsAndData()
  }, [loadStatsAndData])

  const exportToExcel = () => {
    const exportData = exportRows.map(row => ({
      'Tanggal': new Date(row.tanggal).toLocaleDateString('id-ID'),
      'Tipe': row.tipe,
      'Nomor Transaksi': row.nomorTransaksi,
      'Nomor Pelanggan': row.nomorPelanggan,
      'NIK Pelanggan': row.nikPelanggan,
      'Alamat Pelanggan': row.alamatPelanggan,
      'No. Hp Pelanggan': row.noHpPelanggan,
      'Perhiasan': row.perhiasan,
      'Kode Barang': row.kodeBarang,
      'Model': row.model,
      'Kode Pabrik': row.kodePabrik,
      'Warna': row.warna,
      'Kadar': row.kadar,
      'Berat': row.berat,
      'Ongkos': row.ongkos,
      'Jumlah Harga': row.jumlahHarga,
    }))

    const summary = [
      {},
      { 'Tanggal': 'RINGKASAN' },
      { 'Tanggal': 'Total Pendapatan', 'Jumlah Harga': stats.totalRevenue },
      { 'Tanggal': 'Total Pembelian', 'Jumlah Harga': stats.totalPurchaseAmount },
      { 'Tanggal': 'Total Pesanan', 'Jumlah Harga': stats.totalOrders },
      { 'Tanggal': 'Total Stok', 'Jumlah Harga': stats.totalInventory },
    ]

    const fullData = [...exportData, ...summary]

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(fullData)
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Data')

    // Generate filename with filter info
    let filename = 'rekap-toko-emas'
    if (filterType === 'date' && selectedDate) {
      filename += `-${selectedDate}`
    } else if (filterType === 'month' && selectedMonth) {
      filename += `-${selectedMonth}`
    } else if (filterType === 'year' && selectedYear) {
      filename += `-${selectedYear}`
    }
    filename += '.xlsx'

    // Save file
    XLSX.writeFile(wb, filename)
  }

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type)
    setSelectedDate('')
    setSelectedMonth('')
    setSelectedYear('')
  }

  const statCards = [
    {
      name: 'Total Stok',
      value: stats.totalInventory,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Total Pembelian',
      value: formatCurrency(stats.totalPurchaseAmount),
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Pesanan Custom',
      value: stats.totalOrders,
      icon: ClipboardList,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'Total Pendapatan',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Image
            src="/images/logo-white.png"
            alt="KAIROS"
            width={180}
            height={56}
            className="h-12 w-auto max-w-[200px] shrink-0 object-contain object-left"
            unoptimized
          />
          <div>
            <h1 className="text-2xl font-bold mb-2">Selamat Datang di Dashboard KAIROS</h1>
            <p className="text-amber-50">Sistem Informasi Penjualan Perhiasan</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Data</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Filter</label>
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value as FilterType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            >
              <option value="all">Semua Data</option>
              <option value="date">Per Tanggal</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          </div>

          {filterType === 'date' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tanggal</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />
            </div>
          )}

          {filterType === 'month' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Bulan</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />
            </div>
          )}

          {filterType === 'year' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tahun</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="2024"
                min="2000"
                max="2100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Penjualan & Pembelian Bulanan</h3>
          <p className="text-xs text-gray-600 mb-4">Penjualan = jual ke pelanggan, Pembelian = beli dari pelanggan</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#000000', fontSize: 12 }}
                stroke="#000000"
              />
              <YAxis 
                tick={{ fill: '#000000', fontSize: 12 }}
                stroke="#000000"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#000000'
                }}
                labelStyle={{ color: '#000000', fontWeight: 'bold' }}
              />
              <Bar dataKey="penjualan" fill="#f59e0b" name="Penjualan" />
              <Bar dataKey="pembelian" fill="#10b981" name="Pembelian" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm text-gray-900 font-medium">Penjualan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-900 font-medium">Pembelian</span>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Penjualan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#000000', fontSize: 12 }}
                stroke="#000000"
              />
              <YAxis 
                tick={{ fill: '#000000', fontSize: 12 }}
                stroke="#000000"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#000000'
                }}
                labelStyle={{ color: '#000000', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="penjualan" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 5 }}
                activeDot={{ r: 7 }}
                name="Penjualan"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions — hanya menu yang boleh dibaca (RBAC) */}
      {authReady &&
        (can('sales', 'read') ||
          can('purchases', 'read') ||
          can('orders', 'read')) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {can('sales', 'read') && (
                <Link
                  href="/dashboard/sales"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center"
                >
                  <Package className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Jual ke Pelanggan</p>
                  <p className="text-sm text-gray-500">Penjualan dari stok</p>
                </Link>
              )}
              {can('purchases', 'read') && (
                <Link
                  href="/dashboard/purchases"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
                >
                  <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Beli dari Pelanggan</p>
                  <p className="text-sm text-gray-500">Pembelian emas</p>
                </Link>
              )}
              {can('orders', 'read') && (
                <Link
                  href="/dashboard/orders"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
                >
                  <ClipboardList className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Pesanan Custom</p>
                  <p className="text-sm text-gray-500">Terima pesanan custom</p>
                </Link>
              )}
            </div>
          </div>
        )}

      {/* Recap Table */}
      {recapData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekap Transaksi</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Deskripsi</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recapData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.tipe === 'Penjualan' ? 'bg-amber-100 text-amber-800' :
                        item.tipe === 'Pembelian' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.deskripsi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(item.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
