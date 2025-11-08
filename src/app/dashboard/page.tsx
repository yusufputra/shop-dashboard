'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Package, ShoppingCart, ClipboardList, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Stats {
  totalInventory: number
  totalPurchases: number
  totalOrders: number
  totalRevenue: number
}

interface MonthlyData {
  name: string
  penjualan: number
  pembelian: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalInventory: 0,
    totalPurchases: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadMonthlyData = useCallback(async () => {
    try {
      const [ordersData, purchasesData] = await Promise.all([
        supabase.from('pesanan_perhiasan').select('tanggal, harga'),
        supabase.from('pembelian_perhiasan').select('tanggal, harga')
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

      // Aggregate orders (penjualan)
      ordersData.data?.forEach(order => {
        const date = new Date(order.tanggal)
        const monthKey = monthNames[date.getMonth()]
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].penjualan += Number(order.harga)
        }
      })

      // Aggregate purchases (pembelian)
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
      const [inventory, purchases, orders] = await Promise.all([
        supabase.from('stok_perhiasan').select('*', { count: 'exact' }),
        supabase.from('pembelian_perhiasan').select('*', { count: 'exact' }),
        supabase.from('pesanan_perhiasan').select('*')
      ])

      const totalRevenue = orders.data?.reduce((sum, order) => sum + Number(order.harga), 0) || 0

      setStats({
        totalInventory: inventory.count || 0,
        totalPurchases: purchases.count || 0,
        totalOrders: orders.data?.length || 0,
        totalRevenue
      })

      // Load monthly data
      await loadMonthlyData()
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, loadMonthlyData])

  useEffect(() => {
    loadStatsAndData()
  }, [loadStatsAndData])

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
      name: 'Pembelian',
      value: stats.totalPurchases,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Pesanan',
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
        <h1 className="text-2xl font-bold mb-2">Selamat Datang di Dashboard Toko Emas</h1>
        <p className="text-amber-50">Sistem Informasi Penjualan Perhiasan</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Penjualan & Pembelian Bulanan</h3>
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

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/inventory" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center">
            <Package className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Tambah Stok</p>
            <p className="text-sm text-gray-500">Kelola inventori</p>
          </a>
          <a href="/dashboard/purchases" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center">
            <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Pembelian Baru</p>
            <p className="text-sm text-gray-500">Beli perhiasan</p>
          </a>
          <a href="/dashboard/orders" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center">
            <ClipboardList className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Pesanan Baru</p>
            <p className="text-sm text-gray-500">Kelola pesanan</p>
          </a>
        </div>
      </div>
    </div>
  )
}
