import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { urlDescargaTemporal } from "../../../../lib/storage";
import { jwtVerify } from "jose";

export const prerender = false;

const SECRET = new TextEncoder().encode(import.meta.env.GALLERY_JWT_SECRET);

// El embedding de la selfie ya viene calculado desde el navegador del
// atleta (face-api.js, gratis). Este endpoint solo busca coincidencias.
export const POST: APIRoute = async ({ request, params }) => {
  const eventId = params.eventId!;

  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.eventId !== eventId) throw new Error("mismatch");
  } catch {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const { embedding } = await request.json();

  if (!Array.isArray(embedding) || embedding.length !== 128) {
    return new Response(
      JSON.stringify({ error: "No detectamos un rostro claro en la foto. Intenta con otra." }),
      { status: 422 }
    );
  }

  const { data: coincidencias, error } = await supabaseAdmin.rpc("buscar_fotos_por_rostro", {
    p_event_id: eventId,
    p_embedding: embedding,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const ids = (coincidencias ?? []).map((c: any) => c.photo_id);
  let fotos: any[] = [];
  if (ids.length > 0) {
    const { data: photos } = await supabaseAdmin
      .from("photos")
      .select("id, thumbnail_key, nombre_archivo")
      .in("id", ids);

    fotos = await Promise.all(
      (photos ?? []).map(async (p) => ({
        id: p.id,
        nombre: p.nombre_archivo,
        thumbnail_url: p.thumbnail_key ? await urlDescargaTemporal(p.thumbnail_key, 1800) : null,
      }))
    );
  }

  return new Response(JSON.stringify({ fotos }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
