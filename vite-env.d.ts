/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // FIX: Added AD_PUBLISHER_ID and AD_SLOT_ID_BANNER to the environment variables interface to resolve TypeScript errors.
  readonly VITE_AD_PUBLISHER_ID?: string;
  readonly VITE_AD_SLOT_ID_BANNER?: string;
  readonly VITE_AD_SLOT_ID_IN_CONTENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
