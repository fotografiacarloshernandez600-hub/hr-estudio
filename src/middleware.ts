import { defineMiddleware } from "astro:middleware";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(import.meta.env.ADMIN_JWT_SECRET);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  const esRutaAdmin = path.startsWith("/admin") && path !== "/admin/login";
  const esApiAdmin = path.startsWith("/api/admin") && path !== "/api/admin/login";

  if (esRutaAdmin || esApiAdmin) {
    const token = context.cookies.get("admin_session")?.value;
    let autorizado = false;

    if (token) {
      try {
        await jwtVerify(token, SECRET);
        autorizado = true;
      } catch {
        autorizado = false;
      }
    }

    if (!autorizado) {
      if (esApiAdmin) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/admin/login");
    }
  }

  return next();
});
