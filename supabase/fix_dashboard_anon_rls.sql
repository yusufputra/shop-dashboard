-- =============================================================================
-- Perbaikan RLS untuk dashboard Shop (browser memakai anon key, bukan Supabase Auth)
-- =============================================================================
-- Login app memakai cookie JWT + tabel `login`; client Supabase di browser tetap
-- role `anon`. Policy hanya untuk `authenticated` membuat INSERT/UPDATE/DELETE gagal
-- (42501: new row violates row-level security policy).
--
-- Jalankan sekali di SQL Editor Supabase setelah schema / migrasi lain.
-- Aman dijalankan ulang (idempotent).
-- =============================================================================

-- ---------- stok_perhiasan ----------
ALTER TABLE stok_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON stok_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON stok_perhiasan;

CREATE POLICY "Dashboard anon authenticated all"
  ON stok_perhiasan FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------- pembelian_perhiasan ----------
ALTER TABLE pembelian_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON pembelian_perhiasan;

CREATE POLICY "Dashboard anon authenticated all"
  ON pembelian_perhiasan FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------- pesanan_perhiasan ----------
ALTER TABLE pesanan_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON pesanan_perhiasan;

CREATE POLICY "Dashboard anon authenticated all"
  ON pesanan_perhiasan FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------- penjualan_perhiasan ----------
ALTER TABLE penjualan_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete penjualan" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON penjualan_perhiasan;

CREATE POLICY "Dashboard anon authenticated all"
  ON penjualan_perhiasan FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------- customers (jika sudah ada) ----------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    EXECUTE 'ALTER TABLE customers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow anon authenticated customers all" ON customers';
    EXECUTE 'DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customers';
    EXECUTE $p$
      CREATE POLICY "Dashboard anon authenticated all"
        ON customers FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- ---------- customer_point_ledger (jika sudah ada) ----------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_point_ledger'
  ) THEN
    EXECUTE 'ALTER TABLE customer_point_ledger ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow anon authenticated ledger all" ON customer_point_ledger';
    EXECUTE 'DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customer_point_ledger';
    EXECUTE $p$
      CREATE POLICY "Dashboard anon authenticated all"
        ON customer_point_ledger FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- Verifikasi (opsional): SELECT tablename, policyname, roles, cmd FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename;
