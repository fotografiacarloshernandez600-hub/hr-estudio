import type { APIRoute } from "astro";
import { crearUrlSubida } from "../../../lib/storage";
import { randomUUID } from "node:crypto";

// Protegida por src/middleware.ts.
// Este endpoint NUNCA recibe el archivo — solo genera el permiso para que
// el navegador lo suba directo a Supabase Storage. Así evitamos el límite
// de ~4.5MB que Vercel impone al cuerpo de una petición.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { eventId, nombreArchivo } = await request.json();

  if (!eventId || !nombreArchivo) {
    return new Response(JSON.stringify({ error: "Faltan eventId o nombreArchivo" }), {
      status: 400,
    });
  }

  const id = randomUUID();
  const extension = (nombreArchivo.split(".").pop() || "jpg").toLowerCase();
  const storageKey = `eventos/${eventId}/original/${id}.${extension}`;

  try {
    const { token, path } = await crearUrlSubida(storageKey);
    return new Response(JSON.stringify({ storageKey, token, path }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "No se pudo preparar la subida" }), {
      status: 500,
    });
  }
};
