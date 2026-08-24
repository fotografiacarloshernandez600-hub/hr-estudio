import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase";
import { randomBytes } from "node:crypto";

// Protegida por src/middleware.ts (requiere sesión de admin válida).
export const prerender = false;

function generarCodigo() {
  return "HR-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { nombre, fecha, tipo, dias_expiracion } = body;

  if (!nombre || !tipo) {
    return new Response(
      JSON.stringify({ error: "Faltan campos: nombre y tipo son obligatorios" }),
      { status: 400 }
    );
  }
  if (!["entrega", "carrera"].includes(tipo)) {
    return new Response(
      JSON.stringify({ error: "tipo debe ser 'entrega' o 'carrera'" }),
      { status: 400 }
    );
  }

  const codigo_acceso = generarCodigo();
  const codigo_expira_en = dias_expiracion
    ? new Date(Date.now() + dias_expiracion * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({
      nombre,
      fecha: fecha ?? null,
      tipo,
      codigo_acceso,
      codigo_expira_en,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ event: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const GET: APIRoute = async () => {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ events: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
