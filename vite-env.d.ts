// This file configures TypeScript's global process.env type.
// It tells TypeScript about the environment variables available in the project,
// preventing "Property '...' does not exist on type 'ProcessEnv'" errors.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly VITE_API_KEY: string;
      readonly VITE_SUPABASE_URL: string;
      readonly VITE_SUPABASE_ANON_KEY: string;
      readonly VITE_AD_PUBLISHER_ID?: string;
      readonly VITE_AD_SLOT_ID_BANNER?: string;
      readonly VITE_AD_SLOT_ID_IN_CONTENT?: string;
    }
  }
}

// By adding this export, we tell TypeScript to treat this file as a module.
// This is necessary for the global augmentation to be applied correctly.
export {};
