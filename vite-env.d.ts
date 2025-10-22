
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_VERTEX_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // FIX: Add DEV property to match Vite's built-in environment variables.
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}