import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";
import { descargarArchivo, subirArchivo, urlDescargaTemporal } from "../../../lib/storage";
import sharp from "sharp";

// Protegida por src/middleware.ts.
// Se llama DESPUÉS de que el navegador ya subió el original directo a
// Supabase (ver /api/admin/upload-url). Aquí solo generamos el thumbnail
// (pequeño, sin problema de tamaño) y guardamos el registro en la base.
export const prerender = false;
export const maxDuration = 60; // el original puede pesar varios MB, dar tiempo a descargarlo + procesarlo

export const POST: APIRoute = async ({ request }) => {
  const { eventId, storageKey, nombreArchivo } = await request.json();

  if (!eventId || !storageKey) {
    return new Response(JSON.stringify({ error: "Faltan eventId o storageKey" }), { status: 400 });
  }

  let bytes: Buffer;
  try {
    bytes = await descargarArchivo(storageKey);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "No se encontró el archivo recién subido: " + (e.message ?? "") }),
      { status: 400 }
    );
  }

  const thumbKey = storageKey.replace("/original/", "/thumb/").replace(/\.[^./]+$/, ".jpg");

  let metadata, thumbBuffer;
  try {
    metadata = await sharp(bytes).metadata();
    thumbBuffer = await sharp(bytes)
      .resize({ width: 500, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "El archivo no parece una imagen válida" }), {
      status: 400,
    });
  }

  await subirArchivo(thumbKey, thumbBuffer, "image/jpeg");

  const { data, error } = await supabaseAdmin
    .from("photos")
    .insert({
      event_id: eventId,
      storage_key: storageKey,
      thumbnail_key: thumbKey,
      nombre_archivo: nombreArchivo ?? null,
      ancho: metadata.width ?? null,
      alto: metadata.height ?? null,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const thumbnail_url = await urlDescargaTemporal(thumbKey, 1800);

  return new Response(JSON.stringify({ foto: { ...data, thumbnail_url } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
