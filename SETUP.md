# Setup Guide - Toko Emas Dashboard

## 📋 Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis)
- Git (optional)

## 🔧 Langkah-langkah Setup

### 1. Setup Supabase

#### A. Buat Project Supabase

1. Kunjungi [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Sign up atau login
4. Klik "New Project"
5. Isi detail project:
   - Name: `toko-emas-dashboard`
   - Database Password: (simpan password ini)
   - Region: Southeast Asia (Singapore) - untuk latency terbaik
6. Tunggu project selesai dibuat (~2 menit)

#### B. Get API Keys

1. Di dashboard Supabase, klik "Settings" (ikon gear)
2. Pilih "API"
3. Copy:
   - `Project URL` → akan jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → akan jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### C. Setup Database

1. Di dashboard Supabase, klik "SQL Editor"
2. Klik "New Query"
3. Copy semua kode dari file `supabase/schema.sql`
4. Paste di SQL Editor
5. Klik "Run" atau tekan Ctrl+Enter
6. Tunggu hingga selesai (akan muncul "Success")

#### D. Create User untuk Login

1. Di dashboard Supabase, klik "Authentication"
2. Klik "Users"
3. Klik "Add User"
4. Pilih "Create new user"
5. Isi:
   - Email: `admin@tokoemas.com` (atau email apapun)
   - Password: buat password yang kuat (min 6 karakter)
   - Auto Confirm User: ✅ (centang)
6. Klik "Create User"

### 2. Setup Project Next.js

#### A. Install Dependencies

```bash
# Sudah diinstall, tapi untuk memastikan:
npm install
```

#### B. Setup Environment Variables

1. Copy file environment example:

```bash
cp .env.local.example .env.local
```

2. Edit file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ganti dengan URL dan Key dari Supabase Anda (langkah 1B).

### 3. Run Development Server

```bash
npm run dev
```

Buka browser ke [http://localhost:3000](http://localhost:3000)

### 4. Login ke Dashboard

1. Anda akan otomatis redirect ke `/login`
2. Gunakan email dan password yang dibuat di langkah 1D
3. Klik "Masuk"
4. Anda akan masuk ke dashboard!

## ✅ Verifikasi Setup

Setelah login, Anda harus bisa:

- ✅ Melihat dashboard dengan statistik
- ✅ Mengakses menu Stok Perhiasan
- ✅ Mengakses menu Pembelian
- ✅ Mengakses menu Pesanan
- ✅ Menggunakan Kalkulator Emas
- ✅ Logout dan login kembali

## 🎨 Customize

### Ubah Nama Toko

Edit file `src/app/dashboard/layout.tsx` dan `src/app/login/page.tsx`:

```typescript
// Cari "Toko Emas" dan ganti dengan nama toko Anda
<h1 className="...">Nama Toko Anda</h1>
```

### Ubah Warna Theme

Edit Tailwind classes di komponen:
- Primary: `amber-500` dan `yellow-500`
- Ganti dengan warna lain: `blue-500`, `green-500`, `purple-500`, dll

### Tambah Jenis Perhiasan

Edit file form (new/edit pages):

```typescript
<option value="Emas Kuning 24K">Emas Kuning 24K</option>
<option value="Custom Anda">Custom Anda</option>
```

## 🚀 Deploy ke Production

### Vercel (Recommended)

1. Push code ke GitHub
2. Kunjungi [vercel.com](https://vercel.com)
3. Import repository
4. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Manual Build

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Error: "Invalid JWT"

- Pastikan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar
- Clear browser cookies dan coba login lagi

### Error: "relation does not exist"

- Jalankan ulang SQL schema di Supabase
- Pastikan semua tables sudah dibuat

### Error: "Authentication failed"

- Pastikan user sudah dibuat di Supabase Auth
- Pastikan password minimal 6 karakter
- Cek email dan password benar

### Data tidak muncul

- Buka Supabase → Table Editor
- Cek apakah tables kosong atau ada data
- Cek browser console untuk error

### Tidak bisa insert data

- Cek RLS (Row Level Security) policies
- Pastikan user sudah login
- Cek Supabase logs untuk error

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 💡 Tips

1. **Development**: Gunakan `npm run dev` untuk development
2. **Database**: Backup database secara berkala via Supabase Dashboard
3. **Security**: Jangan commit `.env.local` ke Git
4. **Performance**: Enable caching di production
5. **Monitoring**: Gunakan Supabase Analytics untuk monitor usage

## 🆘 Butuh Bantuan?

Jika mengalami masalah:

1. Cek file README.md untuk informasi umum
2. Cek error message di browser console (F12)
3. Cek Supabase logs di dashboard
4. Cek Network tab untuk API errors

---

**Selamat menggunakan Toko Emas Dashboard!** 🎉
