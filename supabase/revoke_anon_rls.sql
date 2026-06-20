-- =============================================================================
-- Cabut policy RLS terbuka untuk role anon/authenticated (API proxy architecture)
-- Jalankan sekali di SQL Editor jika database sudah ada sebelum hardening RLS.
-- App memakai service_role di server (/api/db/*, /api/storage/*) — tetap jalan.
-- =============================================================================

-- Tabel dashboard
DROP POLICY IF EXISTS "Allow authenticated users to view stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON stok_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON stok_perhiasan;

DROP POLICY IF EXISTS "Allow authenticated users to view pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON pembelian_perhiasan;

DROP POLICY IF EXISTS "Allow authenticated users to view pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON pesanan_perhiasan;

DROP POLICY IF EXISTS "Allow authenticated users to view penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON penjualan_perhiasan;

DROP POLICY IF EXISTS "Allow anon authenticated customers all" ON customers;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customers;

DROP POLICY IF EXISTS "Allow anon authenticated ledger all" ON customer_point_ledger;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customer_point_ledger;

DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customer_point_redeem;

DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON gadai_perhiasan;

-- login / RBAC: pastikan tidak ada policy publik
DROP POLICY IF EXISTS "Allow public read access" ON login;
DROP POLICY IF EXISTS "Allow public insert" ON login;
DROP POLICY IF EXISTS "Allow public update" ON login;
DROP POLICY IF EXISTS "Allow public delete" ON login;

ALTER TABLE stok_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesanan_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_redeem ENABLE ROW LEVEL SECURITY;
ALTER TABLE gadai_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE login ENABLE ROW LEVEL SECURITY;

-- Storage: cabut upload/update/delete anon & authenticated (upload lewat API service_role)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads for development" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon updates for development" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes for development" ON storage.objects;

-- Public read untuk preview gambar di browser (bucket jewelry-images)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'jewelry-images');
