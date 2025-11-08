# 🏪 Toko Emas Dashboard - Quick Start Guide

## ✅ Setup Complete!

Your jewelry shop management dashboard is ready to use! Here's what has been created:

## 🎯 What's Built

### 1. **Authentication System** 
- ✅ Secure login with Supabase Auth
- ✅ Protected routes with middleware
- ✅ Session management

### 2. **Inventory Management (Stok Perhiasan)**
- ✅ Add, edit, delete jewelry items
- ✅ Search and filter functionality
- ✅ Track weight and value
- ✅ Auto-generated serial numbers

### 3. **Purchase Management (Pembelian)**
- ✅ Record purchases from customers
- ✅ Customer information tracking
- ✅ Transaction history

### 4. **Order Management (Pesanan)**
- ✅ Custom jewelry orders
- ✅ Down payment (DP) tracking
- ✅ Customer contact details
- ✅ Order status management

### 5. **Gold Calculator (Kalkulator Emas)**
- ✅ Calculate gold purity (SNI 13-3487-2005)
- ✅ Convert karat values
- ✅ Mix calculation (gold, silver, copper, etc.)
- ✅ Indonesian & international standards

### 6. **Dashboard & Analytics**
- ✅ Real-time statistics
- ✅ Sales charts (Bar & Line)
- ✅ Business overview
- ✅ Quick actions

## 🚀 How to Use

### Step 1: Start the Server

The server is already running! Open your browser to:
```
http://localhost:3000
```

### Step 2: Login

You'll need to create a user in Supabase first:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** → **Users**
4. Click **Add User** → **Create new user**
5. Fill in:
   - Email: `admin@tokoemas.com` (or any email)
   - Password: Create a strong password (min 6 characters)
   - ✅ Check "Auto Confirm User"
6. Click **Create User**

### Step 3: Access Dashboard

1. Go to http://localhost:3000
2. You'll be redirected to `/login`
3. Enter your email and password
4. Click **Masuk** (Login)
5. You're in! 🎉

## 📊 Database Schema

Your Supabase database has these tables:

### `stok_perhiasan` (Jewelry Inventory)
- `seri` - Serial number (PK)
- `tanggal` - Date
- `jenis` - Type (18K Gold, etc.)
- `perhiasan` - Jewelry type (Ring, Necklace, etc.)
- `model` - Model/Design
- `berat` - Weight (grams)
- `harga` - Price (IDR)
- `keterangan` - Notes

### `pembelian_perhiasan` (Purchases)
- `seri` - Serial number (PK)
- `tanggal` - Date
- `nama` - Customer name
- `alamat` - Address
- Plus all jewelry details

### `pesanan_perhiasan` (Orders)
- `no` - Order number (PK)
- `tanggal` - Date
- `nama` - Customer name
- `alamat` - Address
- `no_telp` - Phone number
- `bahan_perhiasan` - Material
- `jenis_perhiasan` - Jewelry type
- `model` - Model
- `berat` - Weight
- `dp_pembayaran` - Down payment
- `harga` - Total price
- `keterangan` - Notes

## 🎨 Features Walkthrough

### Adding Inventory
1. Go to **Stok Perhiasan**
2. Click **+ Tambah Stok**
3. Fill in the form:
   - Serial number (auto-generated)
   - Date
   - Type (select from dropdown)
   - Jewelry type
   - Model
   - Weight (grams)
   - Price (IDR)
   - Notes (optional)
4. Click **Simpan Data**

### Recording a Purchase
1. Go to **Pembelian**
2. Click **+ Tambah Pembelian**
3. Fill in customer and jewelry details
4. Click **Simpan Data**

### Creating an Order
1. Go to **Pesanan**
2. Click **+ Tambah Pesanan**
3. Fill in:
   - Customer information
   - Jewelry specifications
   - Down payment amount
   - Total price
4. Click **Simpan Pesanan**

### Using Gold Calculator

**Calculate Purity:**
1. Go to **Kalkulator Emas**
2. Select "Hitung Kadar Emas"
3. Enter pure gold weight
4. Select desired karat
5. Click **Hitung**
6. See the mix required (gold, copper, silver)

**Change Karat:**
1. Select "Ubah Kadar Emas"
2. Enter percentages of each metal
3. Make sure total = 100%
4. Click **Hitung Kadar**
5. See the resulting karat value

## 🔧 Customization

### Change Shop Name
Edit these files:
- `src/app/dashboard/layout.tsx` (line ~68)
- `src/app/login/page.tsx` (line ~52)

Replace "Toko Emas" with your shop name.

### Change Colors
The theme uses Tailwind CSS with amber/yellow gradient.

To change colors, search and replace:
- `amber-500` → your color
- `yellow-500` → your color

Available colors: `blue`, `green`, `purple`, `red`, `pink`, `indigo`, etc.

### Add Jewelry Types
Edit the dropdown options in form files:
- `src/app/dashboard/inventory/new/page.tsx`
- `src/app/dashboard/purchases/new/page.tsx`
- `src/app/dashboard/orders/new/page.tsx`

## 🐛 Troubleshooting

### Can't Login
- Check Supabase Auth → Users (user must exist)
- Verify email and password are correct
- Clear browser cookies and try again

### Data Not Showing
- Check Supabase → Table Editor
- Verify RLS policies are enabled
- Check browser console for errors

### Build Errors
- Make sure `.env.local` has correct values
- Run `npm install` to ensure all dependencies are installed

## 📱 Responsive Design

The dashboard is fully responsive:
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

## 🔐 Security Features

- ✅ Row Level Security (RLS) enabled
- ✅ Server-side authentication
- ✅ Protected routes via middleware
- ✅ Secure session management
- ✅ Input validation

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Icons:** Lucide React
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Import Project**
4. Select your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Build for Production

```bash
npm run build
npm start
```

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## ✨ Next Steps

1. **Add more features:**
   - Sales reports
   - Inventory alerts
   - Customer management
   - Invoice generation
   - Export to Excel/PDF

2. **Enhance UI:**
   - Add dark mode
   - Custom themes
   - More charts
   - Print layouts

3. **Improve functionality:**
   - Barcode scanning
   - Image uploads
   - Email notifications
   - Multi-user roles

## 🎉 You're All Set!

Your Toko Emas Dashboard is ready to manage your jewelry business. Start adding inventory, recording purchases, and managing orders!

**Happy selling! 💎**

---

Need help? Check the detailed SETUP.md file or contact support.
