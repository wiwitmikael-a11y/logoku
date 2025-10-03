// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Access environment variables using process.env, as required by the execution environment.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;
let supabaseError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
    // If keys are missing, set a user-friendly error message. The app will display this.
    supabaseError = "Inisialisasi Supabase gagal: environment variable VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan.";
    // To prevent runtime errors, we assign a dummy object, but the app should halt based on supabaseError.
    supabase = {} as SupabaseClient; 
} else {
    // If keys are present, create the client.
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        supabaseError = `Gagal membuat Supabase client: ${(e as Error).message}`;
        supabase = {} as SupabaseClient;
    }
}

// Export both the client (which may be null) and the error message.
export { supabase, supabaseError };