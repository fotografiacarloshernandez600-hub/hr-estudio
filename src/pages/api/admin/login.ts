import type { APIRoute } from "astro";
import { SignJWT } from "jose";

export const prerender = false;

const SECRET = new TextEncoder().encode(import.meta.env.ADMIN_JWT_SECRET);

export const POST: APIRoute = async ({ request, cookies }) => {
  const { password } = await request.json();

  if (!password || password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), { status: 401 });
  }

  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
