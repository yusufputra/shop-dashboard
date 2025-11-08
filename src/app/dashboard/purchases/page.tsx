'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { PembelianPerhiasan } from '@/types/database'
import Link from 'next/link'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PembelianPerhiasan[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<PembelianPerhiasan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const loadPurchases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pembelian_perhiasan')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
      setFilteredPurchases(data || [])
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  useEffect(() => {
    const filtered = purchases.filter(item =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.perhiasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seri.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPurchases(filtered)
  }, [searchTerm, purchases])

  async function handleDelete(seri: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return

    try {
      const { error } = await supabase
        .from('pembelian_perhiasan')
        .delete()
        .eq('seri', seri)

      if (error) throw error
      loadPurchases()
    } catch (error) {
      console.error('Error deleting purchase:', error)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembelian Perhiasan</h1>
          <p className="text-gray-600">Kelola data pembelian dari pelanggan</p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pembelian</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, seri, jenis..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Pembelian</p>
          <p className="text-3xl font-bold text-gray-900">{filteredPurchases.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(filteredPurchases.reduce((sum, item) => sum + Number(item.harga), 0))}
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Berat</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Harga</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data pembelian
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => (
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
                      {formatWeight(Number(item.berat))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(Number(item.harga))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/purchases/${item.seri}/edit`}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.seri)}
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
