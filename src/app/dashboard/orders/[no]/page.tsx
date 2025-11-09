'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, User, MapPin, Phone, Tag, Package, Weight, DollarSign, FileText, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { PesananPerhiasan } from '@/types/database'

export default function OrderDetailPage({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<PesananPerhiasan | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  async function loadOrder() {
    try {
      const { data, error } = await supabase
        .from('pesanan_perhiasan')
        .select('*')
        .eq('no', no)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
      alert('Gagal memuat data')
      router.push('/dashboard/orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no])

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('pesanan_perhiasan')
        .delete()
        .eq('no', no)

      if (error) throw error

      router.push('/dashboard/orders')
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Data tidak ditemukan</p>
      </div>
    )
  }

  const remainingPayment = Number(order.harga) - Number(order.dp_pembayaran)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
            <p className="text-gray-600">{order.no}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/orders/${order.no}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Informasi Pelanggan
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Nama</p>
                <p className="text-base font-medium text-gray-900">{order.nama}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Alamat</p>
                <p className="text-base text-gray-900">{order.alamat}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">No. Telepon</p>
                <p className="text-base font-medium text-gray-900">{order.no_telp}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(order.tanggal).toLocaleDateString('id-ID', {
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

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Detail Pesanan
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Bahan Perhiasan</p>
                <p className="text-base font-medium text-gray-900">{order.bahan_perhiasan}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Jenis Perhiasan</p>
                <p className="text-base font-medium text-gray-900">{order.jenis_perhiasan}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Model</p>
                <p className="text-base font-medium text-gray-900">{order.model}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Weight className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Berat</p>
                <p className="text-base font-medium text-gray-900">{formatWeight(Number(order.berat))}</p>
              </div>
            </div>

            {order.keterangan && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Keterangan</p>
                  <p className="text-base text-gray-900">{order.keterangan}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Informasi Pembayaran
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-gray-500" />
                <p className="text-sm text-gray-600">Total Harga</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(Number(order.harga))}</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-600">DP Dibayar</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(Number(order.dp_pembayaran))}</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-gray-600">Sisa Pembayaran</p>
              </div>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(remainingPayment)}</p>
            </div>
          </div>

          {remainingPayment > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Perhatian:</strong> Masih ada sisa pembayaran sebesar {formatCurrency(remainingPayment)} yang harus dilunasi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
