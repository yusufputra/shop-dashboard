'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  Package,
  Weight,
  DollarSign,
  FileText,
  CreditCard,
  Hash,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { customerPublicIdPath } from '@/lib/customers/public-id'
import { formatCreatedByLabel } from '@/lib/audit/created-by'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { GadaiPerhiasan } from '@/types/database'
import { useDashboardAuth } from '@/app/dashboard/dashboard-auth-context'
import { decodeGadaiInvoiceParam, gadaiInvoicePath } from '@/lib/gadai/invoice-path'

type GadaiDetail = GadaiPerhiasan & {
  customers?: { public_id: string } | null
}

export default function GadaiDetailPage({
  params,
}: {
  params: Promise<{ noInvoice: string }>
}) {
  const { noInvoice: rawNoInvoice } = use(params)
  const noInvoice = decodeGadaiInvoiceParam(rawNoInvoice)
  const invoicePath = gadaiInvoicePath(noInvoice)
  const { can } = useDashboardAuth()
  const router = useRouter()
  const supabase = createClient()
  const [item, setItem] = useState<GadaiDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  async function loadItem() {
    try {
      const { data, error } = await supabase
        .from('gadai_perhiasan')
        .select('*, customers(public_id)')
        .eq('no_invoice', noInvoice)
        .single()

      if (error) throw error
      setItem(data as GadaiDetail)
    } catch (error) {
      console.error('Error loading gadai:', error)
      alert('Gagal memuat data')
      router.push('/dashboard/gadai')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noInvoice])

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data gadai ini?')) return

    setDeleting(true)
    try {
      if (item?.foto_pelunasan) {
        const path = item.foto_pelunasan.split('/').slice(-2).join('/')
        await supabase.storage.from('jewelry-images').remove([path])
      }

      const { error } = await supabase
        .from('gadai_perhiasan')
        .delete()
        .eq('no_invoice', noInvoice)

      if (error) throw error
      router.push('/dashboard/gadai')
    } catch (error) {
      console.error('Error deleting gadai:', error)
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

  const linkedPublicId =
    item.customers?.public_id != null ? String(item.customers.public_id).trim() : ''
  const kadarLabel = item.kadar == null ? '—' : `${item.kadar}K`
  const lunas = Boolean(item.tgl_pelunasan)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/gadai" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Gadai</h1>
            <p className="text-gray-600">{item.no_invoice}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {can('gadai', 'update') && (
            <Link
              href={`/dashboard/gadai/${invoicePath}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          )}
          {can('gadai', 'delete') && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Menghapus...' : 'Hapus'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lunas ? (
          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Lunas
          </span>
        ) : (
          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
            Aktif
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Informasi Pelanggan
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Nama Pelanggan</p>
                  <p className="text-base font-medium text-gray-900">{item.nama}</p>
                </div>
              </div>

              {item.nik && (
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">NIK</p>
                    <p className="text-base text-gray-900">{item.nik}</p>
                  </div>
                </div>
              )}

              {linkedPublicId && can('customers', 'read') && (
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Member ID</p>
                    <Link
                      href={`/dashboard/customers/${customerPublicIdPath(linkedPublicId)}`}
                      className="text-base font-medium text-amber-700 hover:underline"
                    >
                      {linkedPublicId}
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Dibuat oleh</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatCreatedByLabel(item.created_by_nama)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Detail Barang Gadai
            </h2>
            <div className="space-y-4">
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
                  <p className="text-sm text-gray-600">Nama Barang / Model</p>
                  <p className="text-base font-medium text-gray-900">{item.model}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Kadar</p>
                  <p className="text-base font-medium text-gray-900">{kadarLabel}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Weight className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Berat Barang</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatWeight(Number(item.berat))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Harga Barang</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(Number(item.harga_barang))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Informasi Pinjaman
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Uang Dipinjam</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(Number(item.uang_dipinjam))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Bunga</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatCurrency(Number(item.bunga ?? 0))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Total Pelunasan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      Number(item.total_pelunasan ?? item.uang_dipinjam + (item.bunga ?? 0))
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tgl Peminjaman</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(item.tgl_peminjaman).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tgl Pelunasan</p>
                  <p className="text-base font-medium text-gray-900">
                    {item.tgl_pelunasan
                      ? new Date(item.tgl_pelunasan).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto Pelunasan</h2>
            {item.foto_pelunasan ? (
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={item.foto_pelunasan}
                  alt="Foto pelunasan"
                  width={800}
                  height={450}
                  className="w-full h-full object-contain bg-gray-50"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Belum ada foto pelunasan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
