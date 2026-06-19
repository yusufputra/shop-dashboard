export interface Database {
  public: {
    Tables: {
      login: {
        Row: {
          user_id: string
          nama: string
          email: string | null
          password: string
          group_id: string | null
          is_superuser: boolean
          created_at: string
        }
        Insert: {
          user_id?: string
          nama: string
          email?: string | null
          password: string
          group_id?: string | null
          is_superuser?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          nama?: string
          password?: string
          email?: string | null
          group_id?: string | null
          is_superuser?: boolean
          created_at?: string
        }
      }
      user_groups: {
        Row: {
          group_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          group_id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          group_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      group_menu_permissions: {
        Row: {
          group_id: string
          menu_key: string
          can_read: boolean
          can_create: boolean
          can_update: boolean
          can_delete: boolean
        }
        Insert: {
          group_id: string
          menu_key: string
          can_read?: boolean
          can_create?: boolean
          can_update?: boolean
          can_delete?: boolean
        }
        Update: {
          group_id?: string
          menu_key?: string
          can_read?: boolean
          can_create?: boolean
          can_update?: boolean
          can_delete?: boolean
        }
      }
      login_user_groups: {
        Row: {
          user_id: string
          group_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          group_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          group_id?: string
          created_at?: string
        }
      }
      customers: {
        Row: {
          customer_id: string
          public_id: string
          nama: string
          nik: string | null
          alamat: string | null
          phone: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          customer_id?: string
          public_id: string
          nama: string
          nik?: string | null
          alamat?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          customer_id?: string
          public_id?: string
          nama?: string
          nik?: string | null
          alamat?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
        }
      }
      customer_point_ledger: {
        Row: {
          ledger_id: string
          customer_id: string
          points: number
          weight_grams: number
          ref_type: string
          ref_key: string
          created_at: string
          expires_at: string
        }
        Insert: {
          ledger_id?: string
          customer_id: string
          points: number
          weight_grams?: number
          ref_type: string
          ref_key: string
          created_at?: string
          expires_at: string
        }
        Update: {
          ledger_id?: string
          customer_id?: string
          points?: number
          weight_grams?: number
          ref_type?: string
          ref_key?: string
          created_at?: string
          expires_at?: string
        }
      }
      customer_point_redeem: {
        Row: {
          redeem_id: string
          customer_id: string
          points: number
          keterangan: string | null
          created_by: string | null
          created_by_nama: string | null
          created_at: string
        }
        Insert: {
          redeem_id?: string
          customer_id: string
          points: number
          keterangan?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
        Update: {
          redeem_id?: string
          customer_id?: string
          points?: number
          keterangan?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
      }
      stok_perhiasan: {
        Row: {
          seri: string
          tanggal: string
          jenis: string
          perhiasan: string
          model: string
          fyen: string | null
          kode_pabrik: string | null
          ring_cm: number | null
          panjang_cm: number | null
          tipe_gelang: string | null
          diameter_cm: number | null
          berat: number
          harga: number
          status: string
          pembelian_seri: string | null
          keterangan: string | null
          images: string[] | null
          warna: string | null
          created_by: string | null
          created_by_nama: string | null
          created_at: string
        }
        Insert: {
          seri?: string
          tanggal?: string
          jenis: string
          perhiasan: string
          model: string
          fyen?: string | null
          kode_pabrik?: string | null
          ring_cm?: number | null
          panjang_cm?: number | null
          tipe_gelang?: string | null
          diameter_cm?: number | null
          berat: number
          harga: number
          status?: string
          pembelian_seri?: string | null
          keterangan?: string | null
          images?: string[] | null
          warna?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
        Update: {
          seri?: string
          tanggal?: string
          jenis?: string
          perhiasan?: string
          model?: string
          fyen?: string | null
          kode_pabrik?: string | null
          ring_cm?: number | null
          panjang_cm?: number | null
          tipe_gelang?: string | null
          diameter_cm?: number | null
          berat?: number
          harga?: number
          status?: string
          pembelian_seri?: string | null
          keterangan?: string | null
          images?: string[] | null
          warna?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
      }
      pembelian_perhiasan: {
        Row: {
          seri: string
          tanggal: string
          nama: string
          alamat: string
          kadar: number | null
          perhiasan: string
          model: string
          berat: number
          harga: number
          keterangan: string | null
          customer_id: string | null
          created_by: string | null
          created_by_nama: string | null
          created_at: string
        }
        Insert: {
          seri?: string
          tanggal?: string
          nama: string
          alamat: string
          kadar?: number | null
          perhiasan: string
          model: string
          berat: number
          harga: number
          keterangan?: string | null
          customer_id?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
        Update: {
          seri?: string
          tanggal?: string
          nama?: string
          alamat?: string
          kadar?: number | null
          perhiasan?: string
          model?: string
          berat?: number
          harga?: number
          keterangan?: string | null
          customer_id?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
      }
      pesanan_perhiasan: {
        Row: {
          no: string
          tanggal: string
          nama: string
          alamat: string
          no_telp: string
          bahan_perhiasan: string
          jenis_perhiasan: string
          model: string
          berat: number
          dp_pembayaran: number
          harga: number
          keterangan: string | null
          created_at: string
        }
        Insert: {
          no?: string
          tanggal?: string
          nama: string
          alamat: string
          no_telp: string
          bahan_perhiasan: string
          jenis_perhiasan: string
          model: string
          berat: number
          dp_pembayaran: number
          harga: number
          keterangan?: string | null
          created_at?: string
        }
        Update: {
          no?: string
          tanggal?: string
          nama?: string
          alamat?: string
          no_telp?: string
          bahan_perhiasan?: string
          jenis_perhiasan?: string
          model?: string
          berat?: number
          dp_pembayaran?: number
          harga?: number
          keterangan?: string | null
          created_at?: string
        }
      }
      penjualan_perhiasan: {
        Row: {
          no: string
          tanggal: string
          stok_seri: string
          nama_pembeli: string
          alamat: string
          no_telp: string | null
          harga_jual: number
          biaya: number | null
          keterangan: string | null
          customer_id: string | null
          created_by: string | null
          created_by_nama: string | null
          created_at: string
        }
        Insert: {
          no?: string
          tanggal?: string
          stok_seri: string
          nama_pembeli: string
          alamat: string
          no_telp?: string | null
          harga_jual: number
          biaya?: number | null
          keterangan?: string | null
          customer_id?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
        Update: {
          no?: string
          tanggal?: string
          stok_seri?: string
          nama_pembeli?: string
          alamat?: string
          no_telp?: string | null
          harga_jual?: number
          biaya?: number | null
          keterangan?: string | null
          customer_id?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
      }
      gadai_perhiasan: {
        Row: {
          no_invoice: string
          customer_id: string | null
          nama: string
          nik: string | null
          perhiasan: string
          model: string
          kadar: number | null
          berat: number
          harga_barang: number
          uang_dipinjam: number
          tgl_peminjaman: string
          tgl_pelunasan: string | null
          foto_pelunasan: string | null
          created_by: string | null
          created_by_nama: string | null
          created_at: string
        }
        Insert: {
          no_invoice?: string
          customer_id?: string | null
          nama: string
          nik?: string | null
          perhiasan: string
          model: string
          kadar?: number | null
          berat: number
          harga_barang: number
          uang_dipinjam: number
          tgl_peminjaman?: string
          tgl_pelunasan?: string | null
          foto_pelunasan?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
        Update: {
          no_invoice?: string
          customer_id?: string | null
          nama?: string
          nik?: string | null
          perhiasan?: string
          model?: string
          kadar?: number | null
          berat?: number
          harga_barang?: number
          uang_dipinjam?: number
          tgl_peminjaman?: string
          tgl_pelunasan?: string | null
          foto_pelunasan?: string | null
          created_by?: string | null
          created_by_nama?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type StokPerhiasan = Database['public']['Tables']['stok_perhiasan']['Row']
export type PembelianPerhiasan = Database['public']['Tables']['pembelian_perhiasan']['Row']
export type PesananPerhiasan = Database['public']['Tables']['pesanan_perhiasan']['Row']
export type PenjualanPerhiasan = Database['public']['Tables']['penjualan_perhiasan']['Row']
export type GadaiPerhiasan = Database['public']['Tables']['gadai_perhiasan']['Row']
export type Login = Database['public']['Tables']['login']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerPointLedger = Database['public']['Tables']['customer_point_ledger']['Row']
export type CustomerPointRedeem = Database['public']['Tables']['customer_point_redeem']['Row']

export interface GoldStandard {
  karat: number
  percentage: number
  sniMin: number
  sniMax: number
}
