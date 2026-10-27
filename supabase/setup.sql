-- Nuestro Radar · muro de mensajes
-- Ejecutar una vez en Supabase → SQL Editor.

create extension if not exists pgcrypto;

-- Mensajes del muro
create table if not exists public.muro (
  id      uuid primary key default gen_random_uuid(),
  firma   text not null check (firma in ('El Fonseca','La Sonrisita')),
  tema    text not null default 'General'
          check (tema in ('General','La Sonrisita','El Fonseca','Panoramas','Casas','Región','Cariño')),
  texto   text not null check (char_length(texto) between 1 and 1000),
  creado  timestamptz not null default now()
);

-- La palabra clave se guarda solo como hash (nunca en texto plano)
create table if not exists public.radar_secreto (
  id         int primary key default 1 check (id = 1),
  clave_hash text not null
);

alter table public.muro          enable row level security;
alter table public.radar_secreto enable row level security;

-- Cualquiera con el link puede LEER el muro; nadie escribe directo (solo por las funciones)
drop policy if exists "leer muro" on public.muro;
create policy "leer muro" on public.muro for select to anon, authenticated using (true);
-- radar_secreto: sin políticas = nadie lo lee desde la página

-- Publicar: valida la palabra clave en el servidor
create or replace function public.publicar(p_clave text, p_firma text, p_tema text, p_texto text)
returns public.muro
language plpgsql security definer set search_path = public, extensions as $$
declare r public.muro;
begin
  if not exists (select 1 from public.radar_secreto s where s.clave_hash = crypt(p_clave, s.clave_hash)) then
    raise exception 'clave incorrecta';
  end if;
  insert into public.muro (firma, tema, texto)
  values (p_firma, coalesce(nullif(p_tema,''),'General'), btrim(p_texto))
  returning * into r;
  return r;
end $$;

-- Borrar un mensaje (también requiere la palabra clave)
create or replace function public.borrar(p_clave text, p_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.radar_secreto s where s.clave_hash = crypt(p_clave, s.clave_hash)) then
    raise exception 'clave incorrecta';
  end if;
  delete from public.muro where id = p_id;
end $$;

revoke all on function public.publicar(text,text,text,text) from public;
revoke all on function public.borrar(text,uuid) from public;
grant execute on function public.publicar(text,text,text,text) to anon, authenticated;
grant execute on function public.borrar(text,uuid) to anon, authenticated;

-- Tiempo real: que la página reciba los mensajes nuevos al instante
do $$ begin
  alter publication supabase_realtime add table public.muro;
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- PASO FINAL (ejecútalo tú, aparte, cambiando la palabra):
-- insert into public.radar_secreto (id, clave_hash)
-- values (1, crypt('ESCRIBE_AQUI_LA_PALABRA_CLAVE', gen_salt('bf')))
-- on conflict (id) do update set clave_hash = excluded.clave_hash;
