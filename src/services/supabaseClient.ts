// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initializationError: string | null = null;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Environment variable VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan. Pastikan sudah diatur di Vercel.");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);

} catch (e) {
  initializationError = (e as Error).message;
  console.error("Supabase Initialization Failed:", initializationError);
}

/**
 * Error message if initialization fails, or null if successful.
 */
export const supabaseError = initializationError;

/**
 * Function to get the client. This is the single source of truth for getting
 * the Supabase client instance. Throws if initialization failed.
 * @returns {SupabaseClient}
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (initializationError) {
    // This will be caught by the top-level error boundary in index.tsx
    throw new Error(initializationError);
  }
  // The initial check guarantees supabaseInstance is not null if initializationError is null.
  return supabaseInstance as SupabaseClient;
};