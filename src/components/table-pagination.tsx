'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from '@/lib/pagination'

type TablePaginationProps = {
  page: number
  pageSize: PageSize
  totalCount: number
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalCount <= 0) return null

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <p className="text-sm text-gray-600">
          Menampilkan {from}–{to} dari {totalCount} item
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value) as PageSize)
              onPageChange(0)
            }}
            className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black bg-white"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>/ halaman</span>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0 || loading}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>
        <span className="text-sm text-gray-700 px-2">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Berikutnya
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS }
export type { PageSize }
