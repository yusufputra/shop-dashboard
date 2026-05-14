'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import type { Customer, CustomerPointLedger } from '@/types/database'

export default function CustomersPage() {
  useRoutePermissionGuard('customers', 'read')
  const { can } = useDashboardAuth()
  const supabase = useMemo(() => createClient(), [])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [ledgerRows, setLedgerRows] = useState<CustomerPointLedger[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const nowIso = new Date().toISOString()
      const [cRes, lRes] = await Promise.all([
        supabase.from('customers').select('*').order('nama'),
        supabase.from('customer_point_ledger').select('*').gt('expires_at', nowIso),
      ])
      if (cRes.error) throw cRes.error
      if (lRes.error) throw lRes.error
      setCustomers(cRes.data ?? [])
      setLedgerRows(lRes.data ?? [])
    } catch (e) {
      console.error(e)
      alert('Gagal memuat data pelanggan')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  const activePointsByCustomer = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of ledgerRows) {
      m.set(row.customer_id, (m.get(row.customer_id) ?? 0) + row.points)
    }
    return m
  }, [ledgerRows])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pelanggan & poin</h1>
          <p className="text-gray-600">
            ID 10 digit per pelanggan. Poin aktif = jumlah entri jurnal yang belum kedaluwarsa (1 tahun per
            penjualan).
          </p>
        </div>
        {can('customers', 'create') && (
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah pelanggan</span>
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-700">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-700">
                  ID (10 digit)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-700">
                  Kontak
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-700">
                  Poin aktif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Belum ada pelanggan. {can('customers', 'create') ? 'Klik Tambah pelanggan.' : ''}
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const pid = String(c.public_id).replace(/\D/g, '').slice(0, 10)
                  const pts = activePointsByCustomer.get(c.customer_id) ?? 0
                  return (
                    <tr key={c.customer_id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <Link href={`/dashboard/customers/${pid}`} className="text-amber-700 hover:underline">
                          {c.nama}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-800">{pid}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-amber-700">{pts}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
