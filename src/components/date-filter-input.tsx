'use client'

export interface DateFilterInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
}

export function DateFilterInput({ label, value, onChange, min, max }: DateFilterInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white ${
            value ? 'text-black' : 'text-transparent'
          }`}
        />
        {!value && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none">
            DD/MM/YYYY
          </span>
        )}
      </div>
    </div>
  )
}
