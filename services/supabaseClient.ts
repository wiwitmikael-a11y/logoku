import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// These will be exported.
let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
    // If keys are missing, set a user-friendly error message. The app will display this.
    supabaseError = "Waduh, koneksi ke Supabase gagal. Environment variable VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum di-set di Vercel, bro. Cek lagi gih.";
} else {
    // If keys are present, create the client.
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Export both the client (which may be null) and the error message.
export { supabase, supabaseError };
