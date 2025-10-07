// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Removed the vite/client reference to resolve a type definition error,
// as the necessary environment variable types are explicitly defined below.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
