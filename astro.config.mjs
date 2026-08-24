// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // Astro bloquea por defecto los POST con multipart/form-data (como la
  // subida de fotos) si no reconoce el header Origin, algo que da falsos
  // positivos detrás del proxy de Vercel. Nuestras rutas de admin ya están
  // protegidas por sesión (ver src/middleware.ts), así que desactivamos
  // esta capa extra que estaba bloqueando las subidas.
  security: {
    checkOrigin: false,
  },
});
