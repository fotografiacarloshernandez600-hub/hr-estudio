import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";
import { subirArchivo } from "../../../lib/r2";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

// Protegida por src/middleware.ts (requiere sesión de admin válida).
// Nota: para eventos grandes (miles de fotos), la pantalla de admin sube
// todo lo seleccionado en un solo request. Si Vercel corta por tamaño/tiempo
// en lotes muy grandes, selecciona las fotos en grupos de 50-100 en vez de
// las 1000-5000 completas de una vez.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const eventId = formData.get("eventId") as string | null;
  const archivos = formData.getAll("fotos") as File[];

  if (!eventId || archivos.length === 0) {
    return new Response(JSON.stringify({ error: "Faltan eventId o fotos" }), { status: 400 });
  }

  const resultados = [];

  for (const archivo of archivos) {
    const bytes = Buffer.from(await archivo.arrayBuffer());
    const id = randomUUID();
    const extension = archivo.name.split(".").pop() || "jpg";

    const originalKey = `eventos/${eventId}/original/${id}.${extension}`;
    const thumbKey = `eventos/${eventId}/thumb/${id}.jpg`;

    const metadata = await sharp(bytes).metadata();
    const thumbBuffer = await sharp(bytes)
      .resize({ width: 500, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    await subirArchivo(originalKey, bytes, archivo.type || "image/jpeg");
    await subirArchivo(thumbKey, thumbBuffer, "image/jpeg");

    const { data, error } = await supabaseAdmin
      .from("photos")
      .insert({
        event_id: eventId,
        storage_key: originalKey,
        thumbnail_key: thumbKey,
        nombre_archivo: archivo.name,
        ancho: metadata.width ?? null,
        alto: metadata.height ?? null,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    resultados.push(data);
  }

  return new Response(
    JSON.stringify({ fotos_subidas: resultados.length, fotos: resultados }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
