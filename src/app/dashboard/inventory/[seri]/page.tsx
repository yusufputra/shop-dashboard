'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, Tag, Package, Weight, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { StokPerhiasan } from '@/types/database'
import Image from 'next/image'

export default function InventoryDetailPage({ params }: { params: Promise<{ seri: string }> }) {
  const { seri } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [item, setItem] = useState<StokPerhiasan | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  async function loadItem() {
    try {
      const { data, error } = await supabase
        .from('stok_perhiasan')
        .select('*')
        .eq('seri', seri)
        .single()

      if (error) throw error
      setItem(data)
      
      // Set first image as selected if available
      if (data.images && data.images.length > 0) {
        setSelectedImage(data.images[0])
      }
    } catch (error) {
      console.error('Error loading item:', error)
      alert('Gagal memuat data')
      router.push('/dashboard/inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seri])

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return

    setDeleting(true)
    try {
      // Delete images from storage if exist
      if (item?.images && item.images.length > 0) {
        for (const imageUrl of item.images) {
          const path = imageUrl.split('/').slice(-2).join('/')
          await supabase.storage.from('jewelry-images').remove([path])
        }
      }

      const { error } = await supabase
        .from('stok_perhiasan')
        .delete()
        .eq('seri', seri)

      if (error) throw error

      router.push('/dashboard/inventory')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Data tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/inventory"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Stok Perhiasan</h1>
            <p className="text-gray-600">{item.seri}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/inventory/${item.seri}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Menghapus...' : 'Hapus'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto Perhiasan</h2>
          
          {item.images && item.images.length > 0 ? (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={selectedImage || item.images[0]}
                  alt={item.perhiasan}
                  width={600}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnail Gallery */}
              {item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.images.map((imageUrl, index) => (
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
                        alt={`${item.perhiasan} ${index + 1}`}
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
            <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Tidak ada foto</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              {item.status === 'sold' ? (
                <>
                  <span className="inline-block px-4 py-2 bg-red-100 text-red-900 rounded-full text-sm font-medium">
                    Terjual
                  </span>
                  {item.pembelian_seri && (
                    <div className="text-sm text-gray-600">
                      Referensi Pembelian: <span className="font-medium text-gray-900">{item.pembelian_seri}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="inline-block px-4 py-2 bg-green-100 text-green-900 rounded-full text-sm font-medium">
                  Tersedia
                </span>
              )}
            </div>
          </div>

          {/* Information Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Detail</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Jenis</p>
                  <p className="text-base font-medium text-gray-900">{item.jenis}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Perhiasan</p>
                  <p className="text-base font-medium text-gray-900">{item.perhiasan}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="text-base font-medium text-gray-900">{item.model}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Weight className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Berat</p>
                  <p className="text-base font-medium text-gray-900">{formatWeight(Number(item.berat))}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Harga</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(Number(item.harga))}</p>
                </div>
              </div>

              {item.keterangan && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Keterangan</p>
                    <p className="text-base text-gray-900">{item.keterangan}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
