import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="max-w-lg mx-auto rounded-xl border border-amber-200 bg-amber-50/80 p-8 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Akses ditolak</h1>
      <p className="mt-2 text-gray-600">
        Grup Anda tidak punya izin untuk halaman atau aksi ini. Hubungi
        administrator jika menurut Anda ini salah.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
      >
        Kembali ke dashboard
      </Link>
    </div>
  )
}
