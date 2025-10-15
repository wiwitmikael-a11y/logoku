import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variabel untuk menampung instance Supabase (Singleton pattern)
let supabaseInstance: SupabaseClient | null = null;

/**
 * Mengambil atau membuat instance Supabase client.
 * Ini adalah 'lazy initialization' untuk memastikan environment variables
 * sudah tersedia saat client dibuat.
 * @throws {Error} Jika environment variables untuk Supabase tidak ditemukan.
 * @returns {SupabaseClient} Instance dari Supabase client.
 */
export const getSupabaseClient = (): SupabaseClient => {
  // Jika instance sudah ada, langsung kembalikan
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Jika belum ada, coba buat instance baru
  const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Lemparkan error jika keys tidak ditemukan.
    // Error ini akan ditangkap oleh komponen yang memanggilnya, bukan saat startup.
    throw new Error("Inisialisasi Supabase gagal: environment variable VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan.");
  }

  try {
    // Buat dan simpan instance baru
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (e) {
    // Lemparkan error jika proses pembuatan client gagal
    throw new Error(`Gagal membuat Supabase client: ${(e as Error).message}`);
  }
};

// Ekspor instance dengan nama 'supabase' untuk kompatibilitas minimal,
// namun best practice-nya adalah menggunakan getSupabaseClient().
// Ini akan 'undefined' pada awalnya.
export const supabase = supabaseInstance;
