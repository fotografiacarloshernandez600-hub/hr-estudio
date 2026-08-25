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

// Genera un permiso temporal para que el NAVEGADOR suba un archivo directo
// a Supabase Storage, sin pasar por nuestra función de Vercel (que corta
// peticiones de más de ~4.5MB). Usado para fotos originales, que pueden
// pesar bastante más que eso.
export async function crearUrlSubida(key: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error) throw error;
  return data; // { signedUrl, token, path }
}

// Genera un enlace de descarga temporal (por defecto 1 hora).
export async function urlDescargaTemporal(key: string, segundosValidez = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(key, segundosValidez);
  if (error) throw error;
  return data.signedUrl;
}

// Borra un archivo del bucket (usado al eliminar una foto subida por error).
export async function eliminarArchivo(key: string) {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([key]);
  if (error) throw error;
}

// Borra varios archivos de una vez (usado al eliminar un evento completo).
// Se divide en bloques de 100 para no exceder límites de la API en
// eventos con muchas fotos.
export async function eliminarArchivos(keys: string[]) {
  const validos = keys.filter(Boolean);
  if (validos.length === 0) return;

  for (let i = 0; i < validos.length; i += 100) {
    const bloque = validos.slice(i, i + 100);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(bloque);
    if (error) console.error("No se pudieron borrar algunos archivos del storage:", error);
  }
}

// Descarga el contenido de un archivo directo del bucket (usado para armar
// el ZIP: evitamos generar y volver a pedir una URL firmada por cada foto).
export async function descargarArchivo(key: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(key);
  if (error || !data) throw error ?? new Error(`No se pudo descargar ${key}`);
  return Buffer.from(await data.arrayBuffer());
}
