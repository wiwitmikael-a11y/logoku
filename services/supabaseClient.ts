// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initializationError: string | null = null;

try {
  const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Environment variable VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan. Pastikan sudah diatur di Vercel.");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);

} catch (e) {
  initializationError = (e as Error).message;
  console.error("Supabase Initialization Failed:", initializationError);
}

/**
 * Supabase client instance.
 * @throws {Error} Jika client gagal diinisialisasi saat startup.
 */
export const supabase = supabaseInstance as SupabaseClient;

/**
 * Error message if initialization fails, or null if successful.
 */
export const supabaseError = initializationError;

/**
 * Function to get the client. Included for compatibility, 
 * but direct export is now preferred. Throws if initialization failed.
 * @returns {SupabaseClient}
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (initializationError) {
    throw new Error(initializationError);
  }
  return supabaseInstance as SupabaseClient;
};
