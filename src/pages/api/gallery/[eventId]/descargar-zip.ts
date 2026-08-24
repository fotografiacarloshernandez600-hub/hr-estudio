import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { descargarArchivo } from "../../../../lib/storage";
import { jwtVerify } from "jose";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";

export const prerender = false;
// Tope de tiempo de ejecución en Vercel: 60s es el máximo permitido en el
// plan gratis (Hobby). Con eventos muy grandes (miles de fotos en alta
// resolución) el ZIP puede no alcanzar a armarse en ese tiempo — ver nota
// en el README sobre esta limitación.
export const maxDuration = 60;

const SECRET = new TextEncoder().encode(import.meta.env.GALLERY_JWT_SECRET);

export const GET: APIRoute = async ({ params, url }) => {
  const eventId = params.eventId!;
  // El token viaja como query param (no como header) porque este endpoint
  // se usa como un enlace normal <a href>, no como un fetch: el navegador
  // no deja mandar headers personalizados en una descarga por navegación.
  const token = url.searchParams.get("token") || "";

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.eventId !== eventId) throw new Error("mismatch");
  } catch {
    return new Response("No autorizado", { status: 401 });
  }

  const { data: evento } = await supabaseAdmin
    .from("events")
    .select("nombre")
    .eq("id", eventId)
    .single();

  const { data: photos, error } = await supabaseAdmin
    .from("photos")
    .select("storage_key, nombre_archivo")
    .eq("event_id", eventId);

  if (error || !photos || photos.length === 0) {
    return new Response("No hay fotos para descargar", { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);
  archive.on("warning", (w) => console.warn("Aviso al armar el ZIP:", w));
  archive.on("error", (e) => console.error("Error al armar el ZIP:", e));

  // Vamos agregando cada foto en orden. No es paralelo a propósito: bajar
  // muchas fotos grandes al mismo tiempo puede saturar la memoria de la
  // función serverless (que es limitada en el plan gratis).
  (async () => {
    const nombresUsados = new Set<string>();
    for (const photo of photos) {
      try {
        const buffer = await descargarArchivo(photo.storage_key);
        let nombre = photo.nombre_archivo || photo.storage_key.split("/").pop()!;
        // Evita que dos fotos con el mismo nombre de archivo se pisen dentro del zip.
        if (nombresUsados.has(nombre)) {
          const punto = nombre.lastIndexOf(".");
          const base = punto > -1 ? nombre.slice(0, punto) : nombre;
          const ext = punto > -1 ? nombre.slice(punto) : "";
          nombre = `${base}-${Math.random().toString(36).slice(2, 6)}${ext}`;
        }
        nombresUsados.add(nombre);
        archive.append(buffer, { name: nombre });
      } catch (e) {
        console.error("No se pudo agregar al ZIP:", photo.storage_key, e);
      }
    }
    archive.finalize();
  })();

  const nombreZip = `${(evento?.nombre || "fotos").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.zip`;

  return new Response(Readable.toWeb(passthrough) as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nombreZip}"`,
    },
  });
};
