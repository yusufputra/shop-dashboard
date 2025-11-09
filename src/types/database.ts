export interface Database {
  public: {
    Tables: {
      login: {
        Row: {
          user_id: string
          nama: string
          password: string
          created_at: string
        }
        Insert: {
          user_id?: string
          nama: string
          password: string
          created_at?: string
        }
        Update: {
          user_id?: string
          nama?: string
          password?: string
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
          berat: number
          harga: number
          status: string
          pembelian_seri: string | null
          keterangan: string | null
          images: string[] | null
          created_at: string
        }
        Insert: {
          seri?: string
          tanggal?: string
          jenis: string
          perhiasan: string
          model: string
          berat: number
          harga: number
          status?: string
          pembelian_seri?: string | null
          keterangan?: string | null
          images?: string[] | null
          created_at?: string
        }
        Update: {
          seri?: string
          tanggal?: string
          jenis?: string
          perhiasan?: string
          model?: string
          berat?: number
          harga?: number
          status?: string
          pembelian_seri?: string | null
          keterangan?: string | null
          images?: string[] | null
          created_at?: string
        }
      }
      pembelian_perhiasan: {
        Row: {
          seri: string
          tanggal: string
          nama: string
          alamat: string
          jenis: string
          perhiasan: string
          model: string
          berat: number
          harga: number
          keterangan: string | null
          created_at: string
        }
        Insert: {
          seri?: string
          tanggal?: string
          nama: string
          alamat: string
          jenis: string
          perhiasan: string
          model: string
          berat: number
          harga: number
          keterangan?: string | null
          created_at?: string
        }
        Update: {
          seri?: string
          tanggal?: string
          nama?: string
          alamat?: string
          jenis?: string
          perhiasan?: string
          model?: string
          berat?: number
          harga?: number
          keterangan?: string | null
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
export type Login = Database['public']['Tables']['login']['Row']

export interface GoldStandard {
  karat: number
  percentage: number
  sniMin: number
  sniMax: number
}
