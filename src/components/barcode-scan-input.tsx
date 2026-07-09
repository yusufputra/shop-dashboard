'use client'

import { useCallback } from 'react'

export interface BarcodeScanInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onKeyDown' | 'value' | 'defaultValue'
  > {
  value: string
  onValueChange: (value: string) => void
  onScan?: (value: string) => void
}

/**
 * Input tuned for USB barcode scanners in keyboard-wedge mode.
 * Scanners type the code and send Enter; this component commits on Enter.
 */
export function BarcodeScanInput({
  value,
  onValueChange,
  onScan,
  onBlur,
  ...props
}: BarcodeScanInputProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return
      }

      event.preventDefault()
      const scanned = value.trim()
      if (!scanned) {
        return
      }

      onScan?.(scanned)
      onValueChange('')
    },
    [onScan, onValueChange, value]
  )

  return (
    <input
      {...props}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
      autoComplete="off"
      spellCheck={false}
    />
  )
}
