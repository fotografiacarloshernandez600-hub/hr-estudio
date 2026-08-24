/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly GALLERY_JWT_SECRET: string;
  readonly ADMIN_PASSWORD: string;
  readonly ADMIN_JWT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
