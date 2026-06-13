# Supabase setup for Shop Dashboard

This guide wires a new Supabase project to this app: **PostgreSQL schema / RLS** and the **`jewelry-images` storage bucket** used for inventory photos.

## Prerequisites

- Supabase account ([supabase.com](https://supabase.com))
- Node.js 18+ (for running the Next.js app locally)

---

## 1. Create the Supabase project

1. Open the [Supabase dashboard](https://supabase.com/dashboard) and create a **New project**.
2. Pick a region close to your users (for example **Southeast Asia**).
3. Save the database password you choose.

## 2. API keys and environment variables

1. In the project: **Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the repo root:

   ```bash
   cp .env.local.example .env.local
   ```

4. Fill `.env.local` with those values.

## 3. Database

### Instal baru (fresh)

Jalankan **satu file** di Supabase **SQL Editor** (**SQL → New query**):

| File | Purpose |
| ---- | ------- |
| [`supabase/schema.sql`](../supabase/schema.sql) | **Semua tabel** — login/RBAC, stok, pembelian, pesanan, penjualan, pelanggan, poin, redeem, indexes, RLS, seed grup Administrator |

Lalu jalankan storage (section 4.2):

| File | Purpose |
| ---- | ------- |
| [`supabase/setup_storage_policies.sql`](../supabase/setup_storage_policies.sql) | Bucket `jewelry-images` + policy upload foto stok |

Buat user pertama di tabel `login` (password bcrypt); assign ke grup Administrator jika perlu.

### Database lama (upgrade incremental)

Jika project Supabase sudah ada sebelum perubahan schema, jalankan **hanya** file migrasi yang belum pernah di-run — jangan run ulang `schema.sql` penuh. Contoh:

| File | Kapan dijalankan |
| ---- | ---------------- |
| [`supabase/rbac_schema.sql`](../supabase/rbac_schema.sql) | Belum punya RBAC / user_groups |
| [`supabase/customers_loyalty.sql`](../supabase/customers_loyalty.sql) | Belum punya pelanggan & ledger poin |
| [`supabase/customer_point_redeem.sql`](../supabase/customer_point_redeem.sql) | Belum punya tabel redeem poin |
| [`supabase/add_point_redeem_menu.sql`](../supabase/add_point_redeem_menu.sql) | Belum punya menu RBAC `point_redeem` |
| [`supabase/create_penjualan_table.sql`](../supabase/create_penjualan_table.sql) | Belum punya penjualan |
| [`supabase/add_images_column.sql`](../supabase/add_images_column.sql) | Kolom `images` belum ada |
| [`supabase/add_warna_column.sql`](../supabase/add_warna_column.sql) | Kolom `warna` belum ada |
| [`supabase/add_biaya_column_to_penjualan.sql`](../supabase/add_biaya_column_to_penjualan.sql) | Kolom `biaya` belum ada |
| [`supabase/fix_dashboard_anon_rls.sql`](../supabase/fix_dashboard_anon_rls.sql) | Error 42501 saat create/update dari dashboard |

Lihat [`MIGRATION_GUIDE.md`](../MIGRATION_GUIDE.md) untuk migrasi stok lama (`status`, `pembelian_seri`).

### Dashboard login & RLS

Login memakai tabel **`login`** + cookie JWT (bukan Supabase Auth). Query dari browser memakai **`anon` key**, jadi policy RLS harus mengizinkan role **`anon`** (bukan hanya `authenticated`).

- **Instal baru:** cukup `schema.sql` (sudah termasuk policy `Dashboard anon authenticated all` untuk semua tabel dashboard).
- **Database lama** (hanya policy `authenticated`): jalankan [`supabase/fix_dashboard_anon_rls.sql`](../supabase/fix_dashboard_anon_rls.sql) sekali di SQL Editor.

Tabel yang dibuka untuk dashboard: `stok_perhiasan`, `pembelian_perhiasan`, `pesanan_perhiasan`, `penjualan_perhiasan`, `customers`, `customer_point_ledger`, `customer_point_redeem`. Tabel `login` / RBAC hanya lewat **service role** di API server (RLS login tanpa policy anon — sudah ada di `schema.sql`).

Buat user pertama di tabel `login` (atau seed dari migrasi RBAC); gunakan email/nama + password di `/login`.

### Upload foto stok

Jalankan juga [`supabase/setup_storage_policies.sql`](../supabase/setup_storage_policies.sql) agar role **`anon`** bisa upload ke bucket `jewelry-images`.

---

## 4. Image bucket (`jewelry-images`)

The app uploads inventory images to Storage bucket **`jewelry-images`** (see `src/app/dashboard/inventory/**`).

### 4.1 Create the bucket (dashboard)

1. **Storage → New bucket**
2. **Name:** `jewelry-images`
3. **Public bucket:** enabled (so public URLs work for previews)
4. Optional limits: file size ~**5 MB**, allowed MIME types **`image/*`**

### 4.2 Policies (SQL)

Run [`supabase/setup_storage_policies.sql`](../supabase/setup_storage_policies.sql) in the SQL Editor. It:

- Ensures the bucket exists and is public
- Allows **public read** on objects in `jewelry-images`
- Allows **authenticated** insert / update / delete
- Includes **`anon`** upload/update/delete policies labeled for development — **remove those blocks before production** if you do not want anonymous clients touching Storage

For a minimal production-oriented set, keep only public `SELECT` and authenticated `INSERT` / `UPDATE` / `DELETE` on `bucket_id = 'jewelry-images'`.

### 4.3 Next.js image hostname

[`next.config.ts`](../next.config.ts) restricts `next/image` remote URLs. Replace the sample Supabase host with **your** project host (from `NEXT_PUBLIC_SUPABASE_URL`, without `https://`):

```ts
hostname: '<your-project-ref>.supabase.co',
pathname: '/storage/v1/object/public/jewelry-images/**',
```

Restart `npm run dev` after changing config.

### 4.4 Smoke test

1. Log in and open **Inventory → New**.
2. Upload an image, submit the form.
3. Confirm the row in **Table Editor → `stok_perhiasan`** has `images` populated and the file appears under **Storage → jewelry-images**.

---

## 5. Troubleshooting

### 42501 / 403 — `new row violates row-level security policy`

**Tabel (`stok_perhiasan`, pembelian, dll.):** Jalankan [`supabase/fix_dashboard_anon_rls.sql`](../supabase/fix_dashboard_anon_rls.sql). Penyebab umum: policy hanya untuk `authenticated` padahal browser memakai `anon` key.

**Storage:** Biasanya upload gambar ditolak RLS, atau URL gambar tanpa segmen `public`.

**A. Fix the URL (viewing / linking images)**

For a **public** bucket, the path must include **`public`** after `object`:

| Wrong | Correct |
| ----- | ------- |
| `https://<ref>.supabase.co/storage/v1/object/jewelry-images/inventory/file.png` | `https://<ref>.supabase.co/storage/v1/object/public/jewelry-images/inventory/file.png` |

The app uses `getPublicUrl()`, which generates the **`.../object/public/jewelry-images/...`** form. If you copy a link from elsewhere or build it by hand, omitting `public` often yields **403** when loading the file.

**B. Fix Storage RLS (uploads from the dashboard)**

1. In Supabase: **SQL Editor** → run the full [`supabase/setup_storage_policies.sql`](../supabase/setup_storage_policies.sql) (section 4.2).
2. Confirm the bucket id is exactly **`jewelry-images`** (**Storage → Buckets**).
3. **Stay logged in** to the app when uploading. Uploads use the **authenticated** role; expired sessions or working while logged out will fail if only `authenticated` policies allow `INSERT`.
4. Inspect policies:

   ```sql
   SELECT policyname, cmd, roles
   FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
   ORDER BY policyname;
   ```

   You should see policies allowing **`SELECT`** for reads on `jewelry-images` and **`INSERT`** (and optionally `UPDATE` / `DELETE`) for **`authenticated`** (and optionally **`anon`** if you kept the dev policies in that script).

5. If you added conflicting policies in the dashboard, remove duplicates or re-run the setup script after adjusting drops — overlapping restrictive policies can still block inserts.

After fixing policies, try **Inventory → New** again with a small image.

### Other issues

| Symptom | What to check |
| ------- | ------------- |
| `relation does not exist` | Re-run the SQL files in section 3 in order. |
| Login fails | User exists under **Authentication → Users**, password correct, email confirmed. |
| Upload fails / RLS (general) | Bucket name exactly `jewelry-images`; storage policies applied; user is logged in (authenticated). |
| Broken image previews | URLs use `/object/public/jewelry-images/`; bucket is public for reads; `next.config.ts` `remotePatterns` includes your project host; hard-refresh after config changes. |

---

## Related files

- App Supabase clients: `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- Older storage notes: [`supabase/setup_storage.md`](../supabase/setup_storage.md)
