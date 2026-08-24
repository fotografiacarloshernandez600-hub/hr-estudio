import { supabaseAdmin } from "./supabase";

// Guardamos todo en un único bucket privado de Supabase Storage llamado
// "fotos" (se crea automáticamente al correr supabase/schema.sql, no hace
// falta crearlo a mano). Es privado: nadie puede acceder a una foto sin
// pasar por tu backend, que genera enlaces firmados y temporales.
const BUCKET = "fotos";

export async function subirArchivo(key: string, body: Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: true });
  if (error) throw error;
}

// Genera un enlace de descarga temporal (por defecto 1 hora).
export async function urlDescargaTemporal(key: string, segundosValidez = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(key, segundosValidez);
  if (error) throw error;
  return data.signedUrl;
}
