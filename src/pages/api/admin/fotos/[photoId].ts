import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../../lib/supabase";
import { eliminarArchivo } from "../../../../lib/storage";

// Protegida por src/middleware.ts (requiere sesión de admin válida).
export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const photoId = params.photoId!;

  const { data: photo, error: fetchError } = await supabaseAdmin
    .from("photos")
    .select("storage_key, thumbnail_key")
    .eq("id", photoId)
    .single();

  if (fetchError || !photo) {
    return new Response(JSON.stringify({ error: "Foto no encontrada" }), { status: 404 });
  }

  // Borramos primero los archivos del storage. Si alguno falla (ej. ya no
  // existía), seguimos igual y borramos el registro de la base para no
  // dejar una foto "fantasma" visible en la galería.
  try {
    await eliminarArchivo(photo.storage_key);
    if (photo.thumbnail_key) await eliminarArchivo(photo.thumbnail_key);
  } catch (e) {
    console.error("No se pudo borrar del storage:", e);
  }

  const { error } = await supabaseAdmin.from("photos").delete().eq("id", photoId);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
