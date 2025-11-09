'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, User, Phone, MapPin, Package, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type SaleDetail = {
  no: string
  tanggal: string
  stok_seri: string
  nama_pembeli: string
  alamat: string
  no_telp: string
  harga_jual: number
  biaya: number | null
  keterangan: string | null
  stok_perhiasan: {
    seri: string
    jenis: string
    perhiasan: string
    model: string
    berat: number
    harga: number
    images: string[] | null
  }
}

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    loadSale()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  const loadSale = async () => {
    try {
      const { data, error } = await supabase
        .from('penjualan_perhiasan')
        .select(`
          *,
          stok_perhiasan (
            seri,
            jenis,
            perhiasan,
            model,
            berat,
            harga,
            images
          )
        `)
        .eq('no', resolvedParams.id)
        .single()

      if (error) throw error
      setSale(data as SaleDetail)
      
      // Set first image as selected if available
      if (data.stok_perhiasan.images && data.stok_perhiasan.images.length > 0) {
        setSelectedImage(data.stok_perhiasan.images[0])
      }
    } catch (error) {
      console.error('Error loading sale:', error)
      alert('Gagal memuat data penjualan')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data penjualan ini?')) return

    setDeleting(true)
    try {
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
        .eq('no', resolvedParams.id)

      if (error) throw error
      router.push('/dashboard/sales')
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Gagal menghapus data penjualan')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Data penjualan tidak ditemukan</p>
        <Link href="/dashboard/sales" className="text-amber-600 hover:underline mt-4 inline-block">
          Kembali ke Daftar Penjualan
        </Link>
      </div>
    )
  }

  const images = sale.stok_perhiasan.images

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Penjualan</h1>
            <p className="text-gray-600">No: {sale.no}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/sales/${sale.no}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all"
          >
            <Edit className="w-5 h-5" />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            <span>{deleting ? 'Menghapus...' : 'Hapus'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Item Info */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Informasi Barang</h2>
          
          {images && images.length > 0 ? (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedImage || images[0]}
                  alt={sale.stok_perhiasan.perhiasan}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === imageUrl
                          ? 'border-amber-500 ring-2 ring-amber-200'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${sale.stok_perhiasan.perhiasan} ${index + 1}`}
                        width={150}
                        height={150}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-dashed border-amber-200 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <Package className="w-10 h-10 text-amber-500" />
                </div>
                <p className="text-amber-800 font-medium mb-1">Tidak ada foto</p>
                <p className="text-sm text-amber-600">Barang ini tidak memiliki foto</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Seri Barang</p>
                <p className="font-medium text-gray-900">{sale.stok_perhiasan.seri}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Jenis Perhiasan</p>
                <p className="font-medium text-gray-900">{sale.stok_perhiasan.perhiasan}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Jenis Emas</p>
                <p className="font-medium text-gray-900">{sale.stok_perhiasan.jenis}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium text-gray-900">{sale.stok_perhiasan.model}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Berat</p>
                <p className="font-medium text-gray-900">{sale.stok_perhiasan.berat} gram</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Harga Stok</p>
                <p className="font-medium text-gray-900">Rp {sale.stok_perhiasan.harga.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sale & Customer Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Informasi Penjualan</h2>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Tanggal Penjualan</p>
                <p className="font-medium text-gray-900">
                  {new Date(sale.tanggal).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Harga Jual</p>
                <p className="text-2xl font-bold text-amber-600">
                  Rp {sale.harga_jual.toLocaleString('id-ID')}
                </p>
              </div>
              
              {sale.biaya && sale.biaya > 0 && (
                <>
                  <div className="border-t border-amber-200 pt-2">
                    <p className="text-sm text-gray-600">Biaya Tambahan</p>
                    <p className="text-lg font-semibold text-gray-700">
                      Rp {sale.biaya.toLocaleString('id-ID')}
                    </p>
                  </div>
                  
                  <div className="border-t border-amber-300 pt-2">
                    <p className="text-sm text-gray-600">Total Harga</p>
                    <p className="text-3xl font-bold text-amber-700">
                      Rp {(sale.harga_jual + sale.biaya).toLocaleString('id-ID')}
                    </p>
                  </div>
                </>
              )}
              
              {sale.harga_jual > sale.stok_perhiasan.harga && (
                <div className="border-t border-amber-200 pt-2">
                  <p className="text-sm text-green-600 font-medium">
                    Profit: Rp {(sale.harga_jual - sale.stok_perhiasan.harga - (sale.biaya || 0)).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>

            {sale.keterangan && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Keterangan</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{sale.keterangan}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Informasi Pembeli</h2>
            
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Nama Pembeli</p>
                <p className="font-medium text-gray-900">{sale.nama_pembeli}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">No Telepon</p>
                <p className="font-medium text-gray-900">{sale.no_telp}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Alamat</p>
                <p className="font-medium text-gray-900">{sale.alamat}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
