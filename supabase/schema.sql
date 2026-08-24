-- ============================================================
-- HR Estudio · Esquema de base de datos (Supabase / Postgres)
-- Un solo flujo: se sube un evento (cliente o carrera), se genera un
-- código de acceso, y con ese código se ve y descarga todo directo.
-- Sin reconocimiento facial, sin selección, sin pagos.
-- ============================================================

create extension if not exists pgcrypto; -- para gen_random_uuid()

-- ------------------------------------------------------------
-- events: un registro por sesión/evento fotografiado
-- 'tipo' es solo una etiqueta para organizarte tú (no cambia el
-- comportamiento): 'entrega' para clientes normales, 'carrera' para
-- eventos deportivos. Ambos funcionan exactamente igual.
-- ------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrega', 'carrera')),
  nombre text not null,                -- ej: "Boda Ana y Luis" / "Carrera 5K Paraíso 2026"
  fecha date,
  codigo_acceso text not null unique,  -- código que comparte el cliente para entrar
  codigo_expira_en timestamptz,        -- opcional: null = no expira
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create index idx_events_codigo on events (codigo_acceso);

-- ------------------------------------------------------------
-- photos: cada foto subida a un evento
-- ------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  storage_key text not null,           -- ruta del objeto en Cloudflare R2 (original)
  thumbnail_key text,                  -- ruta del thumbnail en R2 (para no cargar el original en la grilla)
  nombre_archivo text,
  ancho int,
  alto int,
  creado_en timestamptz not null default now()
);

create index idx_photos_event on photos (event_id);
