import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";

// Protegida por src/middleware.ts.
// El cálculo de los embeddings ocurre en el navegador (face-api.js,
// gratis). Este endpoint solo los guarda.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { photo_id, embeddings } = await request.json();

  if (!photo_id || !Array.isArray(embeddings)) {
    return new Response(JSON.stringify({ error: "Faltan photo_id o embeddings" }), {
      status: 400,
    });
  }

  if (embeddings.length === 0) {
    return new Response(JSON.stringify({ ok: true, guardados: 0 }), { status: 200 });
  }

  const { error } = await supabaseAdmin
    .from("face_embeddings")
    .insert(embeddings.map((embedding: number[]) => ({ photo_id, embedding })));

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, guardados: embeddings.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
