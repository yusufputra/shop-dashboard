# Migration Guide - Stock Status Feature

## Overview
This migration adds two new columns to the `stok_perhiasan` table to track sold items:
- `status`: Indicates if item is 'available' or 'sold'
- `pembelian_seri`: References the purchase transaction serial number when sold

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migration_add_stock_status.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /mnt/d/Project/shop-dashboard

# Apply the migration
supabase db push
```

## Migration SQL

The migration script is located at: `supabase/migration_add_stock_status.sql`

It will:
- Add `status` column (default: 'available')
- Add `pembelian_seri` column (nullable)
- Create indexes for better query performance
- Add column comments for documentation

## After Migration

Once the migration is complete:

1. **Restart dev server** if it's running:
   ```bash
   npm run dev
   ```

2. **Test the new features**:
   - Go to Purchases → Add New Purchase
   - Click "Cari Item Stok" to select an existing stock item
   - Complete the purchase
   - Check the Inventory page - the item should now show status "Terjual"
   - The purchase serial will be displayed under the status

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the new columns
ALTER TABLE stok_perhiasan DROP COLUMN IF EXISTS status;
ALTER TABLE stok_perhiasan DROP COLUMN IF EXISTS pembelian_seri;

-- Remove the indexes
DROP INDEX IF EXISTS idx_stok_status;
DROP INDEX IF EXISTS idx_stok_pembelian_seri;
```

## Features Enabled by This Migration

✅ **Stock Tracking**: Items are marked as "sold" instead of being deleted
✅ **Audit Trail**: Each sold item references the purchase transaction
✅ **Inventory Reports**: Can easily filter available vs sold items
✅ **Historical Data**: Maintain complete history of all stock items
✅ **Purchase Verification**: Can trace which purchase bought which stock item

## Notes

- All existing stock items will default to 'available' status
- The purchase form only shows available items in the selector
- Sold items remain in the database with status 'sold' and reference to the purchase serial
- Admin can see full inventory history including sold items
