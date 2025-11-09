'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { StokPerhiasan } from '@/types/database'
import Link from 'next/link'

interface StokWithPurchase extends StokPerhiasan {
  sale_date?: string | null  // Date when sold to customer
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<StokWithPurchase[]>([])
  const [filteredInventory, setFilteredInventory] = useState<StokWithPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterTanggalMasuk, setFilterTanggalMasuk] = useState('')
  const [filterTanggalKeluar, setFilterTanggalKeluar] = useState('')
  const supabase = createClient()

  const loadInventory = useCallback(async () => {
    try {
      // Fetch all inventory items
      const { data: stockData, error: stockError } = await supabase
        .from('stok_perhiasan')
        .select('*')
        .order('created_at', { ascending: false })

      if (stockError) throw stockError

      // Fetch all sales to get the sale dates
      const { data: salesData, error: salesError } = await supabase
        .from('penjualan_perhiasan')
        .select('stok_seri, tanggal')

      if (salesError) throw salesError

      // Create a map of sale dates by stok_seri
      const salesMap = new Map(
        salesData?.map(s => [s.stok_seri, s.tanggal]) || []
      )

      console.log('Sales Map:', Object.fromEntries(salesMap))

      // Merge the data
      const mergedData = stockData?.map(item => {
        const saleDate = item.status === 'sold' ? salesMap.get(item.seri) : null
        
        // Debug: Log sold items
        if (item.status === 'sold') {
          console.log(`Sold Item ${item.seri}: found sale date=${saleDate}`)
        }
        
        return {
          ...item,
          sale_date: saleDate
        }
      }) || []

      setInventory(mergedData)
      setFilteredInventory(mergedData)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  useEffect(() => {
    let filtered = inventory.filter(item =>
      item.perhiasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seri.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Filter by Tanggal Masuk
    if (filterTanggalMasuk) {
      filtered = filtered.filter(item => item.tanggal === filterTanggalMasuk)
    }

    // Filter by Tanggal Keluar (sale date)
    if (filterTanggalKeluar) {
      filtered = filtered.filter(item => 
        item.sale_date === filterTanggalKeluar
      )
    }

    setFilteredInventory(filtered)
  }, [searchTerm, filterTanggalMasuk, filterTanggalKeluar, inventory])

  async function handleDelete(seri: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return

    try {
      const { error } = await supabase
        .from('stok_perhiasan')
        .delete()
        .eq('seri', seri)

      if (error) throw error
      loadInventory()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Gagal menghapus data')
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Perhiasan</h1>
          <p className="text-gray-600">Kelola data inventori perhiasan</p>
        </div>
        <Link
          href="/dashboard/inventory/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Stok</span>
        </Link>
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

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>{showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}</span>
        </button>

        {/* Date Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Tanggal Masuk
              </label>
              <input
                type="date"
                value={filterTanggalMasuk}
                onChange={(e) => setFilterTanggalMasuk(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Tanggal Keluar (Penjualan)
              </label>
              <input
                type="date"
                value={filterTanggalKeluar}
                onChange={(e) => setFilterTanggalKeluar(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />
            </div>
            {(filterTanggalMasuk || filterTanggalKeluar) && (
              <div className="md:col-span-2">
                <button
                  onClick={() => {
                    setFilterTanggalMasuk('')
                    setFilterTanggalKeluar('')
                  }}
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
          <p className="text-3xl font-bold text-gray-900">{filteredInventory.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Tersedia</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredInventory.filter(item => item.status === 'available').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Terjual</p>
          <p className="text-3xl font-bold text-red-600">
            {filteredInventory.filter(item => item.status === 'sold').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Berat Masuk</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatWeight(filteredInventory.reduce((sum, item) => sum + Number(item.berat), 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Berat Keluar</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatWeight(filteredInventory.filter(item => item.status === 'sold').reduce((sum, item) => sum + Number(item.berat), 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(filteredInventory.reduce((sum, item) => sum + Number(item.harga), 0))}
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
                  Model
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Berat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data stok perhiasan
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
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
                          'bg-gray-100 text-gray-900'
                        }`}>
                          {item.warna.charAt(0).toUpperCase() + item.warna.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.perhiasan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatWeight(Number(item.berat))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(Number(item.harga))}
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
                        <Link
                          href={`/dashboard/inventory/${item.seri}/edit`}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-amber-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.seri)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
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
