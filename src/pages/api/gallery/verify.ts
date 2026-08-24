import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";
import { SignJWT } from "jose";

export const prerender = false;

const SECRET = new TextEncoder().encode(import.meta.env.GALLERY_JWT_SECRET);

export const POST: APIRoute = async ({ request }) => {
  const { codigo } = await request.json();

  if (!codigo) {
    return new Response(JSON.stringify({ error: "Falta el código" }), { status: 400 });
  }

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select("id, nombre, tipo, codigo_expira_en, activo")
    .eq("codigo_acceso", codigo.trim().toUpperCase())
    .single();

  if (error || !event) {
    return new Response(JSON.stringify({ error: "Código no válido" }), { status: 404 });
  }
  if (!event.activo) {
    return new Response(
      JSON.stringify({ error: "Este evento ya no está disponible" }),
      { status: 410 }
    );
  }
  if (event.codigo_expira_en && new Date(event.codigo_expira_en) < new Date()) {
    return new Response(JSON.stringify({ error: "El código de acceso expiró" }), { status: 410 });
  }

  const token = await new SignJWT({ eventId: event.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);

  return new Response(
    JSON.stringify({
      token,
      evento: { id: event.id, nombre: event.nombre, tipo: event.tipo },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
