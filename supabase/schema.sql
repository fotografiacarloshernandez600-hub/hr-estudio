-- ============================================================
-- HR Estudio · Esquema de base de datos (Supabase / Postgres)
-- Un solo flujo: se sube un evento (cliente o carrera), se genera un
-- código de acceso, y con ese código se ve y descarga todo directo.
-- Los eventos tipo 'carrera' además tienen búsqueda por selfie (IA que
-- corre gratis en el navegador, sin ningún servicio de pago).
-- ============================================================

create extension if not exists pgcrypto; -- para gen_random_uuid()
create extension if not exists vector;   -- para comparar "huellas" faciales

-- ------------------------------------------------------------
-- events: un registro por sesión/evento fotografiado
-- 'tipo' decide el comportamiento: 'entrega' muestra todas las fotos
-- directo; 'carrera' primero pide una selfie y solo muestra las fotos
-- donde esa persona aparece.
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
  storage_key text not null,           -- ruta del objeto en Storage (original)
  thumbnail_key text,                  -- ruta del thumbnail (para no cargar el original en la grilla)
  nombre_archivo text,
  ancho int,
  alto int,
  creado_en timestamptz not null default now()
);

create index idx_photos_event on photos (event_id);

-- ------------------------------------------------------------
-- face_embeddings: SOLO se llena para eventos tipo 'carrera'.
-- Una foto puede tener varios rostros -> varias filas.
-- 128 = dimensión del descriptor de face-api.js, la librería que corre
-- gratis en el navegador (tuyo al indexar, del atleta al buscar).
-- ------------------------------------------------------------
create table face_embeddings (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  embedding vector(128) not null,
  creado_en timestamptz not null default now()
);

create index idx_face_embeddings_vector on face_embeddings
  using ivfflat (embedding vector_l2_ops) with (lists = 100);

create index idx_face_embeddings_photo on face_embeddings (photo_id);

-- ------------------------------------------------------------
-- Búsqueda por similitud facial: dado el embedding de una selfie, regresa
-- las fotos del evento donde esa persona probablemente aparece.
-- ------------------------------------------------------------
create or replace function buscar_fotos_por_rostro(
  p_event_id uuid,
  p_embedding vector(128),
  p_umbral float default 0.6,   -- distancia euclidiana máxima aceptada (0.6 es el valor típico recomendado para face-api.js)
  p_limite int default 300
)
returns table (photo_id uuid, distancia float)
language sql stable
as $$
  select fe.photo_id, min(fe.embedding <-> p_embedding) as distancia
  from face_embeddings fe
  join photos p on p.id = fe.photo_id
  where p.event_id = p_event_id
    and fe.embedding <-> p_embedding < p_umbral
  group by fe.photo_id
  order by distancia asc
  limit p_limite;
$$;

-- ------------------------------------------------------------
-- Bucket de Supabase Storage donde se guardan las fotos.
-- Privado (public = false): nadie accede directo, solo mediante enlaces
-- firmados y temporales que genera el backend.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;
