/// <reference types="vite/client" />

// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

// FIX: Added explicit type definitions for Vite's environment variables
// to resolve errors where `import.meta.env` was not recognized by TypeScript.
// This provides the necessary types that would otherwise come from 'vite/client'.
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
