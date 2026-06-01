'use client'

import { TIPE_GELANG_OPTIONS } from '@/lib/inventory-extra-fields'

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black'

type Props = {
  kode_pabrik: string
  perhiasan: string
  ring_cm: string
  panjang_cm: string
  tipe_gelang: string
  diameter_cm: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function InventoryExtraFields({
  kode_pabrik,
  perhiasan,
  ring_cm,
  panjang_cm,
  tipe_gelang,
  diameter_cm,
  onChange,
}: Props) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Kode pabrik</label>
        <input
          type="text"
          name="kode_pabrik"
          value={kode_pabrik}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      {perhiasan === 'Cincin' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ring (cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="ring_cm"
            value={ring_cm}
            onChange={onChange}
            required
            className={inputClass}
          />
        </div>
      )}

      {perhiasan === 'Kalung' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Panjang (cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="panjang_cm"
            value={panjang_cm}
            onChange={onChange}
            required
            className={inputClass}
          />
        </div>
      )}

      {perhiasan === 'Gelang' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe gelang <span className="text-red-500">*</span>
            </label>
            <select
              name="tipe_gelang"
              value={tipe_gelang}
              onChange={onChange}
              required
              className={inputClass}
            >
              <option value="">Pilih tipe gelang</option>
              {TIPE_GELANG_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {tipe_gelang === 'rantai' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Panjang (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="panjang_cm"
                value={panjang_cm}
                onChange={onChange}
                required
                className={inputClass}
              />
            </div>
          )}

          {tipe_gelang === 'beagle' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diameter (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="diameter_cm"
                value={diameter_cm}
                onChange={onChange}
                required
                className={inputClass}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}
