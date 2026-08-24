import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { urlDescargaTemporal } from "../../../../lib/r2";
import { jwtVerify } from "jose";

export const prerender = false;

const SECRET = new TextEncoder().encode(import.meta.env.GALLERY_JWT_SECRET);

// Módulo 'entrega': el cliente ya pagó por el evento completo, así que
// cualquier foto del evento se descarga en original solo con el token de
// acceso válido — sin verificación de pago por foto (eso es del módulo 'carrera').
export const GET: APIRoute = async ({ request, params, url }) => {
  const eventId = params.eventId!;
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.eventId !== eventId) throw new Error("mismatch");
  } catch {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const photoId = url.searchParams.get("photoId");
  if (!photoId) {
    return new Response(JSON.stringify({ error: "Falta photoId" }), { status: 400 });
  }

  const { data: photo, error } = await supabaseAdmin
    .from("photos")
    .select("storage_key, event_id, nombre_archivo")
    .eq("id", photoId)
    .single();

  if (error || !photo || photo.event_id !== eventId) {
    return new Response(JSON.stringify({ error: "Foto no encontrada" }), { status: 404 });
  }

  const url_ = await urlDescargaTemporal(photo.storage_key, 300);
  return new Response(JSON.stringify({ url: url_, nombre: photo.nombre_archivo }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
