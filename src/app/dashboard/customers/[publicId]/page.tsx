'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Award, Download, Edit, ShoppingBag, TrendingUp } from 'lucide-react'
import { normalizePublicIdInput } from '@/lib/customers/public-id'
import { downloadCustomerCardPng } from '@/lib/customers/customer-card-download'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import type { Customer, CustomerPointLedger } from '@/types/database'

type SaleRow = {
  no: string
  tanggal: string
  harga_jual: number
  stok_seri: string
}

type PurchaseRow = {
  seri: string
  tanggal: string
  berat: number
  harga: number
}

export default function CustomerDetailPage({ params }: { params: Promise<{ publicId: string }> }) {
  useRoutePermissionGuard('customers', 'read')
  const { can } = useDashboardAuth()
  const { publicId: publicIdParam } = use(params)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const publicId = normalizePublicIdInput(publicIdParam)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [ledger, setLedger] = useState<CustomerPointLedger[]>([])
  const [sales, setSales] = useState<SaleRow[]>([])
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (publicId.length !== 10) {
      setLoading(false)
      setCustomer(null)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const { data: c, error: cErr } = await supabase
          .from('customers')
          .select('*')
          .eq('public_id', publicId)
          .maybeSingle()

        if (cErr) throw cErr
        if (!c) {
          setCustomer(null)
          return
        }
        setCustomer(c)

        const [lRes, sRes, pRes] = await Promise.all([
          supabase
            .from('customer_point_ledger')
            .select('*')
            .eq('customer_id', c.customer_id)
            .order('created_at', { ascending: false }),
          supabase
            .from('penjualan_perhiasan')
            .select('no, tanggal, harga_jual, stok_seri')
            .eq('customer_id', c.customer_id)
            .order('tanggal', { ascending: false }),
          supabase
            .from('pembelian_perhiasan')
            .select('seri, tanggal, berat, harga')
            .eq('customer_id', c.customer_id)
            .order('tanggal', { ascending: false }),
        ])

        if (lRes.error) throw lRes.error
        if (sRes.error) throw sRes.error
        if (pRes.error) throw pRes.error

        setLedger(lRes.data ?? [])
        setSales(sRes.data ?? [])
        setPurchases(pRes.data ?? [])
      } catch (e) {
        console.error(e)
        alert('Gagal memuat detail pelanggan')
        router.push('/dashboard/customers')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [publicId, supabase, router])

  const now = useMemo(() => new Date(), [])

  const activePoints = useMemo(() => {
    return ledger.reduce((sum, row) => {
      if (new Date(row.expires_at) > now) return sum + row.points
      return sum
    }, 0)
  }, [ledger, now])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  if (publicId.length !== 10 || !customer) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-gray-600">Pelanggan tidak ditemukan.</p>
        <Link href="/dashboard/customers" className="text-amber-700 hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    )
  }

  const displayId = String(customer.public_id).replace(/\D/g, '').slice(0, 10)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.nama}</h1>
            <p className="font-mono text-gray-600">ID: {displayId}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {can('customers', 'update') && (
            <Link
              href={`/dashboard/customers/${displayId}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-800 shadow-sm transition-all hover:bg-amber-50"
            >
              <Edit className="h-4 w-4" />
              Edit data
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              void downloadCustomerCardPng(customer, displayId).catch(() =>
                alert('Gagal membuat kartu. Coba lagi.')
              )
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600"
          >
            <Download className="h-4 w-4" />
            Unduh kartu pelanggan
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900">
            <Award className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Saldo poin aktif</h2>
          </div>
          <p className="mt-2 text-4xl font-bold text-amber-700">{activePoints}</p>
          <p className="mt-1 text-sm text-gray-600">
            Hanya entri jurnal yang masa berlaku belum lewat (dari penjualan ke pelanggan, 1 poin per gram).
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Data pelanggan</h2>
          <p className="text-sm text-gray-600">
            NIK: {customer.nik?.trim() ? customer.nik : '—'}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Alamat:{' '}
            {customer.alamat?.trim() ? (
              <span className="whitespace-pre-wrap">{customer.alamat}</span>
            ) : (
              '—'
            )}
          </p>
          <p className="mt-3 text-sm text-gray-600">Telepon: {customer.phone ?? '—'}</p>
          <p className="text-sm text-gray-600">Email: {customer.email ?? '—'}</p>
          <p className="mt-2 text-xs text-gray-500">
            Terdaftar: {new Date(customer.created_at).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Award className="h-5 w-5 text-amber-600" />
          Riwayat poin
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Poin</th>
                <th className="px-3 py-2">Berat (ref.)</th>
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2">Kedaluwarsa</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Belum ada poin
                  </td>
                </tr>
              ) : (
                ledger.map((row) => {
                  const expired = new Date(row.expires_at) <= now
                  return (
                    <tr key={row.ledger_id} className={expired ? 'text-gray-400' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-3 py-2 font-medium">{row.points}</td>
                      <td className="px-3 py-2">{formatWeight(Number(row.weight_grams))}</td>
                      <td className="px-3 py-2">
                        {row.ref_type === 'penjualan' ? (
                          <Link
                            href={`/dashboard/sales/${row.ref_key}`}
                            className="text-amber-700 hover:underline"
                          >
                            {row.ref_key}
                          </Link>
                        ) : (
                          <span>
                            {row.ref_type} / {row.ref_key}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(row.expires_at).toLocaleDateString('id-ID')}
                        {expired && (
                          <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700">
                            kedaluwarsa
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Pembelian dari toko (penjualan)
          </h2>
          <ul className="space-y-3 text-sm">
            {sales.length === 0 ? (
              <li className="text-gray-500">Tidak ada</li>
            ) : (
              sales.map((s) => (
                <li key={s.no} className="flex flex-col rounded-lg border border-gray-100 p-3">
                  <Link href={`/dashboard/sales/${s.no}`} className="font-medium text-amber-700 hover:underline">
                    {s.no}
                  </Link>
                  <span className="text-gray-600">
                    {new Date(s.tanggal).toLocaleDateString('id-ID')} · Seri {s.stok_seri} ·{' '}
                    {formatCurrency(Number(s.harga_jual))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShoppingBag className="h-5 w-5 text-green-600" />
            Penjualan ke toko (pembelian stok)
          </h2>
          <ul className="space-y-3 text-sm">
            {purchases.length === 0 ? (
              <li className="text-gray-500">Tidak ada</li>
            ) : (
              purchases.map((p) => (
                <li key={p.seri} className="flex flex-col rounded-lg border border-gray-100 p-3">
                  <Link href={`/dashboard/purchases/${p.seri}`} className="font-medium text-green-700 hover:underline">
                    {p.seri}
                  </Link>
                  <span className="text-gray-600">
                    {new Date(p.tanggal).toLocaleDateString('id-ID')} · {formatWeight(Number(p.berat))} ·{' '}
                    {formatCurrency(Number(p.harga))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
