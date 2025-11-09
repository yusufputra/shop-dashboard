'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'
import Link from 'next/link'

interface SaleWithStock {
  no: string
  tanggal: string
  nama_pembeli: string
  alamat: string
  no_telp: string | null
  harga_jual: number
  biaya: number | null
  stok_seri: string
  perhiasan: string
  jenis: string
  berat: number
}

export default function SalesPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<SaleWithStock[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleWithStock[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const loadSales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('penjualan_perhiasan')
        .select(`
          *,
          stok_perhiasan!inner(perhiasan, jenis, berat)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedData = data?.map((item) => ({
        ...item,
        perhiasan: item.stok_perhiasan.perhiasan,
        jenis: item.stok_perhiasan.jenis,
        berat: item.stok_perhiasan.berat
      })) || []
      
      setSales(formattedData)
      setFilteredSales(formattedData)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  useEffect(() => {
    const filtered = sales.filter(item =>
      item.nama_pembeli.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stok_seri.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSales(filtered)
  }, [searchTerm, sales])

  const handleDelete = async (no: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data penjualan ini?')) return

    try {
      // Find the sale to get stok_seri
      const sale = sales.find(s => s.no === no)
      
      // Update stock status back to available
      if (sale?.stok_seri) {
        const { error: stockError } = await supabase
          .from('stok_perhiasan')
          .update({ status: 'available' })
          .eq('seri', sale.stok_seri)

        if (stockError) throw stockError
      }

      // Delete sale
      const { error } = await supabase
        .from('penjualan_perhiasan')
        .delete()
        .eq('no', no)

      if (error) throw error
      loadSales()
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Gagal menghapus data penjualan')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const totalRevenue = filteredSales.reduce((sum: number, item: SaleWithStock) => sum + Number(item.harga_jual) + Number(item.biaya || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penjualan Perhiasan</h1>
          <p className="text-gray-600">Jual stok perhiasan ke pelanggan</p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Penjualan</span>
        </Link>
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
          <p className="text-3xl font-bold text-gray-900">{filteredSales.length}</p>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Harga Jual</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Biaya</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-900 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data penjualan
                  </td>
                </tr>
              ) : (
                filteredSales.map((item) => (
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
                      {formatCurrency(Number(item.harga_jual))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.biaya ? formatCurrency(Number(item.biaya)) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-600">
                      {formatCurrency(Number(item.harga_jual) + Number(item.biaya || 0))}
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
                      <button
                        onClick={() => handleDelete(item.no)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
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
