/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly R2_ACCOUNT_ID: string;
  readonly R2_ACCESS_KEY_ID: string;
  readonly R2_SECRET_ACCESS_KEY: string;
  readonly R2_BUCKET_NAME: string;
  readonly GALLERY_JWT_SECRET: string;
  readonly ADMIN_PASSWORD: string;
  readonly ADMIN_JWT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
