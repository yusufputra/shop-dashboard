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
   - **`service_role` key** → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to the browser)
3. In the repo root:

   ```bash
   cp .env.local.example .env.local
   ```

4. Fill `.env.local` with those values plus `AUTH_SESSION_SECRET` (min 32 characters).

The dashboard no longer uses the Supabase **`anon` key**. All database and storage calls from the browser go through Next.js API routes (`/api/db/*`, `/api/storage/*`) which use the service role key server-side and enforce RBAC from the JWT session cookie.

## 3. Database

### Instal baru (fresh)

Jalankan **satu file** di Supabase **SQL Editor** (**SQL → New query**):

| File | Purpose |
| ---- | ------- |
| [`supabase/schema.sql`](../supabase/schema.sql) | **Semua tabel** — login/RBAC, stok, pembelian, pesanan, penjualan, pelanggan, poin, redeem, indexes, RLS, seed grup Administrator |

Lalu jalankan storage (section 4.2):

| File | Purpose |
| ---- | ------- |
| [`supabase/setup_storage_policies.sql`](../supabase/setup_storage_policies.sql) | Bucket `jewelry-images` + public read (upload lewat API server) |

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
| [`supabase/revoke_anon_rls.sql`](../supabase/revoke_anon_rls.sql) | Database lama — cabut policy RLS/storage terbuka untuk `anon` |

Lihat [`MIGRATION_GUIDE.md`](../MIGRATION_GUIDE.md) untuk migrasi stok lama (`status`, `pembelian_seri`).

### Dashboard login & data access

Login memakai tabel **`login`** + cookie JWT (bukan Supabase Auth). Semua query dari browser memakai **API proxy Next.js** (`src/lib/supabase/client.ts` → `/api/db/*`) dengan **service role key** di server, plus pengecekan izin RBAC per menu.

Tabel `login` / RBAC hanya lewat service role di API server. RLS **enabled** tanpa policy `anon`/`authenticated` — defense-in-depth jika anon key bocor.

Buat user pertama di tabel `login` (atau seed dari migrasi RBAC); gunakan email/nama + password di `/login`.

### Upload foto stok

Upload gambar memakai `/api/storage/upload` (service role di server). Bucket `jewelry-images` tetap perlu ada; policy storage untuk anon tidak lagi diperlukan untuk dashboard.

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
- Allows **public read** (`SELECT`) on objects in `jewelry-images` for image previews
- Does **not** grant `INSERT` / `UPDATE` / `DELETE` to `anon` or `authenticated` — uploads go through `/api/storage/*` with the service role key

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

**Dashboard (API proxy):** Pastikan `SUPABASE_SERVICE_ROLE_KEY` terisi di `.env.local`. Service role melewati RLS; error 42501 dari app biasanya berarti key salah/kosong atau request tidak lewat API server.

**Database lama yang masih punya policy anon terbuka:** Jalankan [`supabase/revoke_anon_rls.sql`](../supabase/revoke_anon_rls.sql) setelah deploy API proxy.

**Storage:** Upload gambar ditolak RLS → pastikan upload lewat app (login + izin inventory/gadai), bukan langsung ke Supabase Storage API dengan anon key.

**A. Fix the URL (viewing / linking images)**

For a **public** bucket, the path must include **`public`** after `object`:

| Wrong | Correct |
| ----- | ------- |
| `https://<ref>.supabase.co/storage/v1/object/jewelry-images/inventory/file.png` | `https://<ref>.supabase.co/storage/v1/object/public/jewelry-images/inventory/file.png` |

The app uses `getPublicUrl()`, which generates the **`.../object/public/jewelry-images/...`** form. If you copy a link from elsewhere or build it by hand, omitting `public` often yields **403** when loading the file.

**B. Fix Storage RLS (uploads from the dashboard)**

1. In Supabase: **SQL Editor** → run [`supabase/setup_storage_policies.sql`](../supabase/setup_storage_policies.sql) or [`supabase/revoke_anon_rls.sql`](../supabase/revoke_anon_rls.sql) (includes storage section).
2. Confirm the bucket id is exactly **`jewelry-images`** (**Storage → Buckets**).
3. Uploads use **service role** via `/api/storage/upload` — user must be logged in with RBAC permission; JWT session cookie must be valid.
4. Inspect policies:

   ```sql
   SELECT policyname, cmd, roles
   FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
   ORDER BY policyname;
   ```

   For API-proxy setup you should see **`SELECT`** (public read) on `jewelry-images` only — not `INSERT` for `anon`.

After fixing policies, try **Inventory → New** again with a small image.

### Other issues

| Symptom | What to check |
| ------- | ------------- |
| `relation does not exist` | Re-run the SQL files in section 3 in order. |
| Login fails | User exists under **Authentication → Users**, password correct, email confirmed. |
| Upload fails / RLS (general) | Bucket name exactly `jewelry-images`; `SUPABASE_SERVICE_ROLE_KEY` set; logged in with create/update permission on inventory or gadai. |
| Broken image previews | URLs use `/object/public/jewelry-images/`; bucket is public for reads; `next.config.ts` `remotePatterns` includes your project host; hard-refresh after config changes. |

---

## Related files

- App Supabase access: `src/lib/supabase/client.ts` (API proxy client), `src/lib/api/db-client.ts`, `src/app/api/db/*`, `src/app/api/storage/*`
