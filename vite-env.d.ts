
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_VERTEX_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // FIX: Add DEV property to correctly type Vite's `import.meta.env.DEV` flag.
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}