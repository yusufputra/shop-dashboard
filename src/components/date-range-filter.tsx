'use client'

import { DateFilterInput } from '@/components/date-filter-input'

export interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  startLabel?: string
  endLabel?: string
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Tanggal Mulai',
  endLabel = 'Tanggal Akhir',
}: DateRangeFilterProps) {
  const hasRange = Boolean(startDate || endDate)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <DateFilterInput
        label={startLabel}
        value={startDate}
        onChange={onStartDateChange}
        max={endDate || undefined}
      />
      <DateFilterInput
        label={endLabel}
        value={endDate}
        onChange={onEndDateChange}
        min={startDate || undefined}
      />
      {hasRange && (
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => {
              onStartDateChange('')
              onEndDateChange('')
            }}
            className="text-sm text-amber-700 hover:text-amber-800 font-medium"
          >
            Hapus filter tanggal
          </button>
        </div>
      )}
    </div>
  )
}
