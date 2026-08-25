import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";
import { urlDescargaTemporal } from "../../../lib/storage";

// Protegida por src/middleware.ts.
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const eventId = url.searchParams.get("eventId");
  const soloSinIndexar = url.searchParams.get("soloSinIndexar") === "true";

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Falta eventId" }), { status: 400 });
  }

  const { data: photos, error } = await supabaseAdmin
    .from("photos")
    .select("id, thumbnail_key, nombre_archivo, face_embeddings(id)")
    .eq("event_id", eventId);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const filtradas = soloSinIndexar
    ? (photos ?? []).filter((p: any) => !p.face_embeddings || p.face_embeddings.length === 0)
    : photos ?? [];

  const fotos = await Promise.all(
    filtradas.map(async (p: any) => ({
      id: p.id,
      thumbnail_url: p.thumbnail_key ? await urlDescargaTemporal(p.thumbnail_key, 1800) : null,
    }))
  );

  return new Response(JSON.stringify({ fotos }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
