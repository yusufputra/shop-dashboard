'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Phone, Eye } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { PesananPerhiasan } from '@/types/database'
import Link from 'next/link'

export default function OrdersPage() {
  const [orders, setOrders] = useState<PesananPerhiasan[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PesananPerhiasan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pesanan_perhiasan')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
      setFilteredOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const filtered = orders.filter(item =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenis_perhiasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.no.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
  }, [searchTerm, orders])

  async function handleDelete(no: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) return

    try {
      const { error } = await supabase
        .from('pesanan_perhiasan')
        .delete()
        .eq('no', no)

      if (error) throw error
      loadOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Gagal menghapus pesanan')
    }
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Pesanan Perhiasan</h1>
          <p className="text-gray-600">Kelola pesanan custom dari pelanggan</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pesanan</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, no pesanan..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Pesanan</p>
          <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total DP</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(filteredOrders.reduce((sum, item) => sum + Number(item.dp_pembayaran), 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(filteredOrders.reduce((sum, item) => sum + Number(item.harga), 0))}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">No</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Nama</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Kontak</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Jenis</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Berat</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">DP</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data pesanan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((item) => (
                  <tr key={item.no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {item.no_telp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.jenis_perhiasan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatWeight(Number(item.berat))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(item.dp_pembayaran))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(Number(item.harga))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/orders/${item.no}`}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Link>
                        <Link
                          href={`/dashboard/orders/${item.no}/edit`}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-purple-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.no)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
