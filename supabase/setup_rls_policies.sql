-- =============================================
-- RLS Policies for Shop Dashboard
-- =============================================
-- This script sets up Row-Level Security policies
-- for all tables to allow CRUD operations
-- =============================================

-- For development: Allow all operations for anon and authenticated users
-- WARNING: In production, implement proper user-based policies!

-- =============================================
-- STOK PERHIASAN (Inventory)
-- =============================================

-- Enable RLS on stok_perhiasan
ALTER TABLE stok_perhiasan ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON stok_perhiasan;

-- Allow SELECT for everyone
CREATE POLICY "Allow public read access"
ON stok_perhiasan
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow INSERT for everyone (development)
CREATE POLICY "Allow public insert"
ON stok_perhiasan
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow UPDATE for everyone (development)
CREATE POLICY "Allow public update"
ON stok_perhiasan
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow DELETE for everyone (development)
CREATE POLICY "Allow public delete"
ON stok_perhiasan
FOR DELETE
TO anon, authenticated
USING (true);

-- =============================================
-- PEMBELIAN PERHIASAN (Purchases)
-- =============================================

ALTER TABLE pembelian_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pembelian_perhiasan;

CREATE POLICY "Allow public read access"
ON pembelian_perhiasan
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert"
ON pembelian_perhiasan
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update"
ON pembelian_perhiasan
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete"
ON pembelian_perhiasan
FOR DELETE
TO anon, authenticated
USING (true);

-- =============================================
-- PESANAN PERHIASAN (Orders)
-- =============================================

ALTER TABLE pesanan_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pesanan_perhiasan;

CREATE POLICY "Allow public read access"
ON pesanan_perhiasan
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert"
ON pesanan_perhiasan
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update"
ON pesanan_perhiasan
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete"
ON pesanan_perhiasan
FOR DELETE
TO anon, authenticated
USING (true);

-- =============================================
-- PENJUALAN PERHIASAN (Sales)
-- =============================================

ALTER TABLE penjualan_perhiasan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON penjualan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON penjualan_perhiasan;

CREATE POLICY "Allow public read access"
ON penjualan_perhiasan
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert"
ON penjualan_perhiasan
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update"
ON penjualan_perhiasan
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete"
ON penjualan_perhiasan
FOR DELETE
TO anon, authenticated
USING (true);

-- =============================================
-- LOGIN (Users)
-- =============================================

ALTER TABLE login ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON login;
DROP POLICY IF EXISTS "Allow public insert" ON login;
DROP POLICY IF EXISTS "Allow public update" ON login;
DROP POLICY IF EXISTS "Allow public delete" ON login;

CREATE POLICY "Allow public read access"
ON login
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert"
ON login
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update"
ON login
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete"
ON login
FOR DELETE
TO anon, authenticated
USING (true);

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this to verify all policies are created:
-- 
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
