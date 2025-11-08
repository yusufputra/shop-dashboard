'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { StokPerhiasan } from '@/types/database'
import Link from 'next/link'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<StokPerhiasan[]>([])
  const [filteredInventory, setFilteredInventory] = useState<StokPerhiasan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const loadInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stok_perhiasan')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInventory(data || [])
      setFilteredInventory(data || [])
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
    const filtered = inventory.filter(item =>
      item.perhiasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seri.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredInventory(filtered)
  }, [searchTerm, inventory])

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan seri, jenis, model, atau perhiasan..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
          />
        </div>
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
          <p className="text-gray-600 text-sm mb-1">Total Berat</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatWeight(filteredInventory.reduce((sum, item) => sum + Number(item.berat), 0))}
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
                  Tanggal
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Jenis
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
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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
