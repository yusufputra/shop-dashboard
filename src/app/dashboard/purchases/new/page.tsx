'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, X } from 'lucide-react'
import Link from 'next/link'
import { generateSerialNumber, formatCurrency, formatWeight } from '@/lib/utils'
import { StokPerhiasan } from '@/types/database'

export default function NewPurchasePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [stockItems, setStockItems] = useState<StokPerhiasan[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] = useState<StokPerhiasan | null>(null)
  const [formData, setFormData] = useState({
    seri: generateSerialNumber('BUY'),
    tanggal: new Date().toISOString().split('T')[0],
    nama: '',
    alamat: '',
    jenis: '',
    perhiasan: '',
    model: '',
    berat: '',
    harga: '',
    keterangan: ''
  })

  const loadStockItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stok_perhiasan')
        .select('*')
        .eq('status', 'available') // Only show available items
        .order('created_at', { ascending: false })

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error('Error loading stock items:', error)
    }
  }, [supabase])

  useEffect(() => {
    loadStockItems()
  }, [loadStockItems])

  const filteredStockItems = stockItems.filter(item =>
    item.seri.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.perhiasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectStock = (stock: StokPerhiasan) => {
    setSelectedStock(stock)
    setFormData(prev => ({
      ...prev,
      jenis: stock.jenis,
      perhiasan: stock.perhiasan,
      model: stock.model,
      berat: stock.berat.toString(),
      harga: stock.harga.toString(),
      keterangan: `Item dari stok: ${stock.seri}${stock.keterangan ? ' - ' + stock.keterangan : ''}`
    }))
    setSearchModalOpen(false)
    setSearchTerm('')
  }

  const handleClearSelection = () => {
    setSelectedStock(null)
    setFormData(prev => ({
      ...prev,
      jenis: '',
      perhiasan: '',
      model: '',
      berat: '',
      harga: '',
      keterangan: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Insert purchase record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('pembelian_perhiasan')
        .insert([{
          ...formData,
          berat: parseFloat(formData.berat),
          harga: parseFloat(formData.harga),
          keterangan: formData.keterangan || null
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // If an item was selected from stock, mark it as sold
      if (selectedStock && purchaseData) {
        const { error: updateError } = await supabase
          .from('stok_perhiasan')
          .update({ 
            status: 'sold',
            pembelian_seri: purchaseData.seri
          })
          .eq('seri', selectedStock.seri)

        if (updateError) {
          console.error('Error updating stock status:', updateError)
          // Continue even if update fails - purchase is already recorded
          alert('Pembelian berhasil disimpan, tetapi gagal mengupdate status stok. Silakan update manual dari halaman inventory.')
        }
      }

      router.push('/dashboard/purchases')
    } catch (error) {
      console.error('Error adding purchase:', error)
      alert('Gagal menambahkan data pembelian')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pembelian</h1>
          <p className="text-gray-600">Input data pembelian perhiasan dari pelanggan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Stock Item Selector */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-900">Pilih Item dari Stok (Opsional)</h3>
            {selectedStock && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Hapus Pilihan
              </button>
            )}
          </div>
          {selectedStock ? (
            <div className="space-y-2">
              <div className="bg-white p-3 rounded border border-blue-300">
                <div className="text-sm text-gray-900">
                  <span className="font-semibold">Terpilih:</span> {selectedStock.perhiasan} - {selectedStock.jenis} ({selectedStock.seri})
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {formatWeight(Number(selectedStock.berat))} • {formatCurrency(Number(selectedStock.harga))}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 p-2 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ Item ini akan ditandai sebagai TERJUAL setelah pembelian disimpan
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Cari Item Stok</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Seri <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="seri"
              value={formData.seri}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis <span className="text-red-500">*</span>
            </label>
            <select
              name="jenis"
              value={formData.jenis}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Jenis</option>
              <option value="Emas Kuning 18K">Emas Kuning 18K</option>
              <option value="Emas Kuning 14K">Emas Kuning 14K</option>
              <option value="Emas Merah 18K">Emas Merah 18K</option>
              <option value="Emas Putih 18K">Emas Putih 18K</option>
              <option value="Perak">Perak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perhiasan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="perhiasan"
              value={formData.perhiasan}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berat (gram) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              name="berat"
              value={formData.berat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="harga"
              value={formData.harga}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Data</span>
              </>
            )}
          </button>
          <Link href="/dashboard/purchases" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Batal
          </Link>
        </div>
      </form>

      {/* Stock Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Pilih Item dari Stok</h2>
                <button
                  onClick={() => {
                    setSearchModalOpen(false)
                    setSearchTerm('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan seri, nama, jenis, atau model..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Body - Stock List */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {filteredStockItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm ? 'Tidak ada item yang cocok dengan pencarian' : 'Tidak ada item stok'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredStockItems.map((item) => (
                    <button
                      key={item.seri}
                      type="button"
                      onClick={() => handleSelectStock(item)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{item.perhiasan}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-medium">
                              {item.jenis}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Seri: <span className="font-medium text-gray-900">{item.seri}</span></div>
                            <div>Model: {item.model}</div>
                            <div className="flex items-center gap-4">
                              <span>Berat: <span className="font-medium text-gray-900">{formatWeight(Number(item.berat))}</span></span>
                              <span>Harga: <span className="font-medium text-gray-900">{formatCurrency(Number(item.harga))}</span></span>
                            </div>
                            {item.keterangan && (
                              <div className="text-xs text-gray-500 mt-1">
                                Keterangan: {item.keterangan}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="px-3 py-1 bg-green-100 text-green-900 rounded text-xs font-medium">
                            Pilih
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
