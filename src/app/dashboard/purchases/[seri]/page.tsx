'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, User, MapPin, Tag, Package, Weight, DollarSign, FileText, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { PembelianPerhiasan, StokPerhiasan } from '@/types/database'
import Image from 'next/image'

export default function PurchaseDetailPage({ params }: { params: Promise<{ seri: string }> }) {
  const { seri } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [purchase, setPurchase] = useState<PembelianPerhiasan | null>(null)
  const [relatedItem, setRelatedItem] = useState<StokPerhiasan | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  async function loadPurchase() {
    try {
      const { data, error } = await supabase
        .from('pembelian_perhiasan')
        .select('*')
        .eq('seri', seri)
        .single()

      if (error) throw error
      setPurchase(data)

      // Load related inventory item if exists
      const { data: itemData } = await supabase
        .from('stok_perhiasan')
        .select('*')
        .eq('pembelian_seri', seri)
        .single()

      if (itemData) {
        setRelatedItem(itemData)
        // Set first image as selected if available
        if (itemData.images && itemData.images.length > 0) {
          setSelectedImage(itemData.images[0])
        }
      }
    } catch (error) {
      console.error('Error loading purchase:', error)
      alert('Gagal memuat data')
      router.push('/dashboard/purchases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seri])

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('pembelian_perhiasan')
        .delete()
        .eq('seri', seri)

      if (error) throw error

      router.push('/dashboard/purchases')
    } catch (error) {
      console.error('Error deleting purchase:', error)
      alert('Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Data tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/purchases"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Pembelian Perhiasan</h1>
            <p className="text-gray-600">{purchase.seri}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/purchases/${purchase.seri}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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
        {/* Purchase Information */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Informasi Pelanggan
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Nama</p>
                  <p className="text-base font-medium text-gray-900">{purchase.nama}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Alamat</p>
                  <p className="text-base text-gray-900">{purchase.alamat}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal Pembelian</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(purchase.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Item Details Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-600" />
              Detail Barang yang Dibeli
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Jenis</p>
                  <p className="text-base font-medium text-gray-900">{purchase.jenis}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Perhiasan</p>
                  <p className="text-base font-medium text-gray-900">{purchase.perhiasan}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="text-base font-medium text-gray-900">{purchase.model}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Weight className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Berat</p>
                  <p className="text-base font-medium text-gray-900">{formatWeight(Number(purchase.berat))}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Harga Beli</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(Number(purchase.harga))}</p>
                </div>
              </div>

              {purchase.keterangan && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Keterangan</p>
                    <p className="text-base text-gray-900">{purchase.keterangan}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Inventory Item */}
        <div className="space-y-6">
          {relatedItem ? (
            <>
              {/* Item Images */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Foto Barang di Stok</h2>
                  <Link
                    href={`/dashboard/inventory/${relatedItem.seri}`}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Lihat di Inventori →
                  </Link>
                </div>
                
                {relatedItem.images && relatedItem.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={selectedImage || relatedItem.images[0]}
                        alt={relatedItem.perhiasan}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Thumbnail Gallery */}
                    {relatedItem.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {relatedItem.images.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(imageUrl)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImage === imageUrl
                                ? 'border-green-500 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                          >
                            <Image
                              src={imageUrl}
                              alt={`${relatedItem.perhiasan} ${index + 1}`}
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

              {/* Inventory Item Info */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status di Inventori</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">No Seri Stok</p>
                    <p className="text-base font-medium text-gray-900">{relatedItem.seri}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {relatedItem.status === 'sold' ? (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-900 rounded-full text-sm font-medium">
                        Sudah Terjual
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-900 rounded-full text-sm font-medium">
                        Tersedia
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Harga Jual</p>
                    <p className="text-xl font-bold text-amber-600">{formatCurrency(Number(relatedItem.harga))}</p>
                  </div>

                  {relatedItem.keterangan && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Keterangan Stok</p>
                      <p className="text-sm text-gray-900">{relatedItem.keterangan}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada di Inventori</h3>
                <p className="text-gray-600 mb-4">
                  Barang ini belum ditambahkan ke stok inventori
                </p>
                <Link
                  href={`/dashboard/inventory/new?from_purchase=${purchase.seri}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>Tambah ke Stok</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
