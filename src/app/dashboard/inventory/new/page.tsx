'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { generateSerialNumber } from '@/lib/utils'
import Image from 'next/image'

function NewInventoryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromPurchase = searchParams.get('from_purchase')
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [goldPrice, setGoldPrice] = useState<number | null>(null)
  const [loadingGold, setLoadingGold] = useState(false)
  const [useGoldPrice, setUseGoldPrice] = useState(false)
  const [manualGoldPrice, setManualGoldPrice] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    seri: generateSerialNumber('STK'),
    tanggal: new Date().toISOString().split('T')[0],
    jenis: '',
    perhiasan: '',
    model: '',
    berat: '',
    harga: '',
    pembelian_seri: '',
    keterangan: '',
    warna: ''
  })

  useEffect(() => {
    // Load purchase data if coming from purchase page
    const loadPurchaseData = async () => {
      if (!fromPurchase) return
      
      try {
        const { data, error } = await supabase
          .from('pembelian_perhiasan')
          .select('*')
          .eq('seri', fromPurchase)
          .single()

        if (error) throw error
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            jenis: data.jenis,
            perhiasan: data.perhiasan,
            model: data.model,
            berat: data.berat.toString(),
            pembelian_seri: data.seri,
            keterangan: data.keterangan || '',
            warna: ''
          }))
        }
      } catch (error) {
        console.error('Error loading purchase data:', error)
      }
    }

    loadPurchaseData()
  }, [fromPurchase, supabase])

  useEffect(() => {
    // fetch the server-side proxy that attempts to get Antam price
    const fetchGold = async () => {
      setLoadingGold(true)
      try {
        const res = await fetch('/api/gold-price')
        const data = await res.json()
        if (data && data.pricePerGram) {
          setGoldPrice(Number(data.pricePerGram))
        } else {
          setGoldPrice(null)
        }
      } catch (err) {
        console.error('Failed to fetch gold price', err)
        setGoldPrice(null)
      } finally {
        setLoadingGold(false)
      }
    }

    fetchGold()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    setSelectedImages(prev => [...prev, ...newFiles])

    // Create preview URLs
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload images to Supabase Storage first
      const imageUrls: string[] = []
      
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        
        for (const file of selectedImages) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${formData.seri}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `inventory/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('jewelry-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading image:', uploadError)
            throw new Error(`Gagal upload gambar: ${uploadError.message}`)
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('jewelry-images')
            .getPublicUrl(filePath)

          imageUrls.push(publicUrl)
        }
        
        setUploadingImages(false)
      }

      // Insert data with image URLs
      const { error } = await supabase
        .from('stok_perhiasan')
        .insert([{
          seri: formData.seri,
          tanggal: formData.tanggal,
          jenis: formData.jenis,
          perhiasan: formData.perhiasan,
          model: formData.model,
          berat: parseFloat(formData.berat),
          harga: parseFloat(formData.harga),
          pembelian_seri: formData.pembelian_seri || null,
          keterangan: formData.keterangan || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          warna: formData.warna || null
        }])

      if (error) throw error

      router.push('/dashboard/inventory')
    } catch (error) {
      console.error('Error adding inventory:', error)
      alert(error instanceof Error ? error.message : 'Gagal menambahkan data stok')
    } finally {
      setLoading(false)
      setUploadingImages(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData(prev => {
      const next = { ...prev, [name]: value }

      // If berat changes and we use gold price, auto-calc harga
      if (name === 'berat' && useGoldPrice && goldPrice) {
        const beratNum = parseFloat(String(value))
        if (!isNaN(beratNum)) {
          // round to nearest integer IDR
          next.harga = String(Math.round(beratNum * goldPrice))
        }
      }

      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/inventory"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Stok Perhiasan</h1>
          <p className="text-gray-600">Input data stok perhiasan baru</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {fromPurchase && formData.pembelian_seri && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Data diambil dari pembelian</p>
              <p className="text-sm text-green-700 mt-1">
                Data perhiasan telah diisi otomatis dari pembelian <span className="font-semibold">{formData.pembelian_seri}</span>. 
                Silakan lengkapi harga jual dan upload foto barang.
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Seri <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="seri"
              value={formData.seri}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kadar <span className="text-red-500">*</span>
            </label>
            <select
              name="jenis"
              value={formData.jenis}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Kadar</option>
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="3K">3K</option>
              <option value="4K">4K</option>
              <option value="5K">5K</option>
              <option value="6K">6K</option>
              <option value="7K">7K</option>
              <option value="8K">8K</option>
              <option value="9K">9K</option>
              <option value="10K">10K</option>
              <option value="11K">11K</option>
              <option value="12K">12K</option>
              <option value="13K">13K</option>
              <option value="14K">14K</option>
              <option value="15K">15K</option>
              <option value="16K">16K</option>
              <option value="17K">17K</option>
              <option value="18K">18K</option>
              <option value="19K">19K</option>
              <option value="20K">20K</option>
              <option value="21K">21K</option>
              <option value="22K">22K</option>
              <option value="23K">23K</option>
              <option value="24K">24K</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warna <span className="text-red-500">*</span>
            </label>
            <select
              name="warna"
              value={formData.warna}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Warna</option>
              <option value="kuning">Kuning</option>
              <option value="rosegold">Rosegold</option>
              <option value="putih">Putih</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perhiasan <span className="text-red-500">*</span>
            </label>
            <select
              name="perhiasan"
              value={formData.perhiasan}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            >
              <option value="">Pilih Perhiasan</option>
              <option value="Kalung">Kalung</option>
              <option value="Gelang">Gelang</option>
              <option value="Cincin">Cincin</option>
              <option value="Anting">Anting</option>
              <option value="Liontin">Liontin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              placeholder="Contoh: Klasik, Modern, Etnik"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berat (gram) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              name="berat"
              value={formData.berat}
              onChange={handleChange}
              required
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="harga"
                value={formData.harga}
                onChange={(e) => {
                  // if user edits harga manually, disable auto calc
                  setUseGoldPrice(false)
                  const target = e.target as HTMLInputElement
                  const { name, value } = target
                  setFormData(prev => ({ ...prev, [name]: value }))
                }}
                required
                placeholder="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
              />

              <button
                type="button"
                onClick={async () => {
                  setUseGoldPrice(v => !v)
                  // if enabling and we have goldPrice and berat, compute right away
                  if (!useGoldPrice && goldPrice) {
                    const beratNum = parseFloat(String(formData.berat))
                    if (!isNaN(beratNum)) {
                      setFormData(prev => ({ ...prev, harga: String(Math.round(beratNum * goldPrice)) }))
                    }
                  }
                }}
                className={`px-3 py-2 border rounded-lg text-sm ${useGoldPrice ? 'bg-amber-500 text-white border-amber-500' : 'text-gray-700 bg-white'}`}
                title={useGoldPrice ? 'Auto calculate from current gold price' : 'Manual harga'}
              >
                {useGoldPrice ? 'Auto' : 'Manual'}
              </button>
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {loadingGold ? (
                  <span>Memuat harga emas...</span>
                ) : goldPrice ? (
                  <span>Harga acuan Pluang: Rp {new Intl.NumberFormat('id-ID').format(goldPrice)} / gram</span>
                ) : (
                  <span>Tidak dapat mengambil harga Antam otomatis</span>
                )}
                {!goldPrice && !loadingGold && (
                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-amber-600 hover:text-amber-700 underline text-xs"
                  >
                    {showManualInput ? 'Sembunyikan' : 'Input manual'}
                  </button>
                )}
              </div>

              {showManualInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualGoldPrice}
                    onChange={(e) => setManualGoldPrice(e.target.value)}
                    placeholder="Harga emas per gram (Rp)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-black"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const price = parseFloat(manualGoldPrice)
                      if (!isNaN(price) && price > 0) {
                        setGoldPrice(price)
                        setShowManualInput(false)
                        setUseGoldPrice(true)
                        // auto-calc if berat exists
                        const beratNum = parseFloat(String(formData.berat))
                        if (!isNaN(beratNum)) {
                          setFormData(prev => ({ ...prev, harga: String(Math.round(beratNum * price)) }))
                        }
                      }
                    }}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={3}
              placeholder="Keterangan tambahan (opsional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-black"
            />
          </div>

          {/* Image Upload Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto Perhiasan
            </label>
            
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Pilih Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {selectedImages.length > 0 ? `${selectedImages.length} gambar dipilih` : 'Bisa upload multiple gambar'}
                </span>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || uploadingImages}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploadingImages ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{uploadingImages ? 'Mengupload gambar...' : 'Menyimpan...'}</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Data</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/inventory"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function NewInventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <NewInventoryForm />
    </Suspense>
  )
}
