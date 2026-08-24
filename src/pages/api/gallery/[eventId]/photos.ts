import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { urlDescargaTemporal } from "../../../../lib/storage";
import { jwtVerify } from "jose";

export const prerender = false;

const SECRET = new TextEncoder().encode(import.meta.env.GALLERY_JWT_SECRET);

async function verificarToken(request: Request, eventId: string) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.eventId === eventId;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request, params }) => {
  const eventId = params.eventId!;
  const autorizado = await verificarToken(request, eventId);
  if (!autorizado) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const { data: photos, error } = await supabaseAdmin
    .from("photos")
    .select("id, thumbnail_key, storage_key, nombre_archivo")
    .eq("event_id", eventId)
    .order("creado_en", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const conThumbnail = await Promise.all(
    (photos ?? []).map(async (p) => ({
      id: p.id,
      nombre: p.nombre_archivo,
      thumbnail_url: p.thumbnail_key ? await urlDescargaTemporal(p.thumbnail_key, 3600) : null,
    }))
  );

  return new Response(JSON.stringify({ fotos: conThumbnail }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
