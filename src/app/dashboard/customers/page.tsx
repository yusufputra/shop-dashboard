'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { customerPublicIdPath } from '@/lib/customers/public-id'
import { computeAvailablePoints } from '@/lib/customers/points'
import { useDashboardAuth, useRoutePermissionGuard } from '@/app/dashboard/dashboard-auth-context'
import type { Customer, CustomerPointLedger, CustomerPointRedeem } from '@/types/database'

export default function CustomersPage() {
  useRoutePermissionGuard('customers', 'read')
  const { can } = useDashboardAuth()
  const supabase = useMemo(() => createClient(), [])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [ledgerRows, setLedgerRows] = useState<CustomerPointLedger[]>([])
  const [redeemRows, setRedeemRows] = useState<CustomerPointRedeem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const nowIso = new Date().toISOString()
      const [cRes, lRes, rRes] = await Promise.all([
        supabase.from('customers').select('*').order('nama'),
        supabase.from('customer_point_ledger').select('*').gt('expires_at', nowIso),
        supabase.from('customer_point_redeem').select('*'),
      ])
      if (cRes.error) throw cRes.error
      if (lRes.error) throw lRes.error
      if (rRes.error) throw rRes.error
      setCustomers(cRes.data ?? [])
      setLedgerRows(lRes.data ?? [])
      setRedeemRows(rRes.data ?? [])
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
    const ledgerByCustomer = new Map<string, CustomerPointLedger[]>()
    const redeemByCustomer = new Map<string, CustomerPointRedeem[]>()

    for (const row of ledgerRows) {
      const list = ledgerByCustomer.get(row.customer_id) ?? []
      list.push(row)
      ledgerByCustomer.set(row.customer_id, list)
    }
    for (const row of redeemRows) {
      const list = redeemByCustomer.get(row.customer_id) ?? []
      list.push(row)
      redeemByCustomer.set(row.customer_id, list)
    }

    const m = new Map<string, number>()
    for (const c of customers) {
      m.set(
        c.customer_id,
        computeAvailablePoints(
          ledgerByCustomer.get(c.customer_id) ?? [],
          redeemByCustomer.get(c.customer_id) ?? []
        )
      )
    }
    return m
  }, [customers, ledgerRows, redeemRows])

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        String(c.public_id).toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
    )
  }, [customers, searchTerm])

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
            Nomor pelanggan unik per orang. Poin aktif = jurnal belum kedaluwarsa dikurangi total redeem.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('point_redeem', 'read') && (
            <Link
              href="/dashboard/customers/redeem"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-amber-800 shadow-sm transition-all hover:bg-amber-50"
            >
              <span>Redeem poin</span>
            </Link>
          )}
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
      </div>

      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, nomor pelanggan, atau telepon..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
        </div>
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
                  Nomor pelanggan
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada pelanggan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const pid = String(c.public_id)
                  const pts = activePointsByCustomer.get(c.customer_id) ?? 0
                  return (
                    <tr key={c.customer_id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <Link
                          href={`/dashboard/customers/${customerPublicIdPath(pid)}`}
                          className="text-amber-700 hover:underline"
                        >
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
