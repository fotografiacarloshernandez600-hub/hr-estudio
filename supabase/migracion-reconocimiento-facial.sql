-- ============================================================
-- Migración: agregar reconocimiento facial (módulo carreras)
-- Corre esto SOLO si ya tenías las tablas events/photos de antes.
-- Si es un proyecto de Supabase nuevo, no uses este archivo — usa
-- schema.sql completo, que ya incluye todo esto.
-- ============================================================

create extension if not exists vector;

create table if not exists face_embeddings (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  embedding vector(128) not null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_face_embeddings_vector on face_embeddings
  using ivfflat (embedding vector_l2_ops) with (lists = 100);

create index if not exists idx_face_embeddings_photo on face_embeddings (photo_id);

create or replace function buscar_fotos_por_rostro(
  p_event_id uuid,
  p_embedding vector(128),
  p_umbral float default 0.6,
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
