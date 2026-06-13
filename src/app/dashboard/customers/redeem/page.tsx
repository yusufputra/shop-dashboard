'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Award, MinusCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchCustomerByPublicId } from '@/lib/customers/resolve'
import { computeAvailablePoints } from '@/lib/customers/points'
import { customerPublicIdPath } from '@/lib/customers/public-id'
import { createdByFields } from '@/lib/audit/created-by'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import type { CustomerPointLedger, CustomerPointRedeem } from '@/types/database'

type RedeemRow = CustomerPointRedeem & {
  customers: { public_id: string; nama: string } | null
}

export default function RedeemPointPage() {
  useRoutePermissionGuard('point_redeem', 'read')
  const { session, can } = useDashboardAuth()
  const supabase = useMemo(() => createClient(), [])

  const [memberId, setMemberId] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [customerPublicId, setCustomerPublicId] = useState<string | null>(null)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)

  const [pointsInput, setPointsInput] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [redeemHistory, setRedeemHistory] = useState<RedeemRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_point_redeem')
        .select('*, customers(public_id, nama)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setRedeemHistory((data ?? []) as RedeemRow[])
    } catch (e) {
      console.error(e)
      alert('Gagal memuat riwayat redeem')
    } finally {
      setHistoryLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const lookupMember = async () => {
    const raw = memberId.trim()
    if (!raw) {
      setLookupMessage('Masukkan ID pelanggan')
      setCustomerId(null)
      setCustomerName(null)
      setCustomerPublicId(null)
      setAvailablePoints(null)
      return
    }

    setLookupLoading(true)
    setLookupMessage(null)
    try {
      const customer = await fetchCustomerByPublicId(supabase, raw)
      if (!customer) {
        setCustomerId(null)
        setCustomerName(null)
        setCustomerPublicId(null)
        setAvailablePoints(null)
        setLookupMessage('Pelanggan tidak ditemukan')
        return
      }

      const [ledgerRes, redeemRes] = await Promise.all([
        supabase
          .from('customer_point_ledger')
          .select('*')
          .eq('customer_id', customer.customer_id),
        supabase
          .from('customer_point_redeem')
          .select('*')
          .eq('customer_id', customer.customer_id),
      ])

      if (ledgerRes.error) throw ledgerRes.error
      if (redeemRes.error) throw redeemRes.error

      const balance = computeAvailablePoints(
        (ledgerRes.data ?? []) as CustomerPointLedger[],
        (redeemRes.data ?? []) as CustomerPointRedeem[]
      )

      setCustomerId(customer.customer_id)
      setCustomerName(customer.nama)
      setCustomerPublicId(raw)
      setAvailablePoints(balance)
      setLookupMessage(null)
    } catch (e) {
      console.error(e)
      alert('Gagal memuat data pelanggan')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!can('point_redeem', 'create')) {
      alert('Anda tidak punya izin untuk melakukan redeem poin')
      return
    }
    if (!customerId || availablePoints === null) {
      alert('Cari pelanggan terlebih dahulu')
      return
    }

    const points = parseInt(pointsInput, 10)
    if (!Number.isFinite(points) || points <= 0) {
      alert('Jumlah poin harus bilangan bulat positif')
      return
    }

    if (points > availablePoints) {
      alert(`Poin tidak cukup. Saldo tersedia: ${availablePoints}`)
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('customer_point_redeem').insert({
        customer_id: customerId,
        points,
        keterangan: keterangan.trim() || null,
        ...createdByFields(session),
      })

      if (error) throw error

      setPointsInput('')
      setKeterangan('')
      setAvailablePoints(availablePoints - points)
      await loadHistory()
      alert('Redeem poin berhasil disimpan')
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan redeem poin')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redeem poin</h1>
          <p className="text-gray-600">
            Proses manual: cari pelanggan, masukkan jumlah poin, dan keterangan penggunaan.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Search className="h-5 w-5 text-amber-600" />
          Cari pelanggan
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void lookupMember()
              }
            }}
            placeholder="ID / nomor pelanggan"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <button
            type="button"
            onClick={() => void lookupMember()}
            disabled={lookupLoading}
            className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {lookupLoading ? 'Mencari…' : 'Cari'}
          </button>
        </div>
        {lookupMessage && <p className="mt-2 text-sm text-red-600">{lookupMessage}</p>}

        {customerId && customerName && availablePoints !== null && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">{customerName}</p>
                <p className="font-mono text-sm text-gray-600">ID: {customerPublicId}</p>
                {customerPublicId && (
                  <Link
                    href={`/dashboard/customers/${customerPublicIdPath(customerPublicId)}`}
                    className="text-sm text-amber-700 hover:underline"
                  >
                    Lihat profil pelanggan
                  </Link>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-900">Saldo poin tersedia</p>
                <p className="text-3xl font-bold text-amber-700">{availablePoints}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {can('point_redeem', 'create') ? (
      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <MinusCircle className="h-5 w-5 text-red-600" />
          Form redeem
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah poin</label>
            <input
              type="number"
              min={1}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              disabled={!customerId || submitting}
              placeholder="Contoh: 50"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-50"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Keterangan (digunakan untuk apa)
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={!customerId || submitting}
              rows={3}
              placeholder="Contoh: Tukar voucher diskon 10%"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-50"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Redeem dicatat atas nama: {session?.nama?.trim() || '—'}
          </p>
          <button
            type="submit"
            disabled={!customerId || submitting || availablePoints === 0}
            className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-red-600 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Menyimpan…' : 'Simpan redeem'}
          </button>
        </div>
      </form>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Anda hanya punya izin melihat riwayat redeem. Hubungi admin untuk izin <strong>Buat</strong> pada menu Redeem poin.
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Award className="h-5 w-5 text-amber-600" />
          Riwayat redeem terbaru
        </h2>
        {historyLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Pelanggan</th>
                  <th className="px-3 py-2">Poin</th>
                  <th className="px-3 py-2">Keterangan</th>
                  <th className="px-3 py-2">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {redeemHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      Belum ada redeem
                    </td>
                  </tr>
                ) : (
                  redeemHistory.map((row) => (
                    <tr key={row.redeem_id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2">
                        {row.customers ? (
                          <div>
                            <Link
                              href={`/dashboard/customers/${customerPublicIdPath(String(row.customers.public_id))}`}
                              className="font-medium text-amber-700 hover:underline"
                            >
                              {row.customers.nama}
                            </Link>
                            <p className="font-mono text-xs text-gray-500">{row.customers.public_id}</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2 font-semibold text-red-600">−{row.points}</td>
                      <td className="px-3 py-2 text-gray-700">{row.keterangan?.trim() || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.created_by_nama?.trim() || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
