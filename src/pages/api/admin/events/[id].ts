import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { eliminarArchivos } from "../../../../lib/storage";

// Protegida por src/middleware.ts (requiere sesión de admin válida).
export const prerender = false;
// Eventos con muchas fotos pueden tardar en borrarse del storage.
export const maxDuration = 60;

export const DELETE: APIRoute = async ({ params }) => {
  const eventId = params.id!;

  const { data: evento } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .single();

  if (!evento) {
    return new Response(JSON.stringify({ error: "Evento no encontrado" }), { status: 404 });
  }

  const { data: fotos } = await supabaseAdmin
    .from("photos")
    .select("storage_key, thumbnail_key")
    .eq("event_id", eventId);

  const keys = (fotos ?? []).flatMap((f) => [f.storage_key, f.thumbnail_key]);
  await eliminarArchivos(keys);

  // Borrar el evento arrastra también sus fotos y embeddings faciales
  // (relaciones con "on delete cascade" en el esquema).
  const { error } = await supabaseAdmin.from("events").delete().eq("id", eventId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
