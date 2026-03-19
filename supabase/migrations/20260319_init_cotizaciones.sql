-- Core schema for quotation metadata and PDF storage.
create extension if not exists pgcrypto;

create sequence if not exists public.cotizaciones_numero_seq start 1 increment 1;

create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null default nextval('public.cotizaciones_numero_seq'),
  cliente text not null,
  fecha date not null default current_date,
  total numeric(12, 2) not null check (total >= 0),
  pdf_url text not null default '',
  productos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cotizaciones_numero_unique unique (numero)
);

create index if not exists cotizaciones_numero_idx on public.cotizaciones (numero desc);
create index if not exists cotizaciones_cliente_idx on public.cotizaciones (cliente);
create index if not exists cotizaciones_fecha_idx on public.cotizaciones (fecha desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists cotizaciones_set_updated_at on public.cotizaciones;
create trigger cotizaciones_set_updated_at
before update on public.cotizaciones
for each row
execute function public.set_updated_at();

alter table public.cotizaciones enable row level security;

drop policy if exists "cotizaciones_public_select" on public.cotizaciones;
create policy "cotizaciones_public_select"
on public.cotizaciones
for select
to anon
using (true);

drop policy if exists "cotizaciones_public_insert" on public.cotizaciones;
create policy "cotizaciones_public_insert"
on public.cotizaciones
for insert
to anon
with check (true);

drop policy if exists "cotizaciones_public_update" on public.cotizaciones;
create policy "cotizaciones_public_update"
on public.cotizaciones
for update
to anon
using (true)
with check (true);

drop policy if exists "cotizaciones_public_delete" on public.cotizaciones;
create policy "cotizaciones_public_delete"
on public.cotizaciones
for delete
to anon
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cotizaciones',
  'cotizaciones',
  true,
  2097152,
  array['application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket allows read access; writes are handled from server-side endpoints.
drop policy if exists "cotizaciones_bucket_public_read" on storage.objects;
create policy "cotizaciones_bucket_public_read"
on storage.objects
for select
to anon
using (bucket_id = 'cotizaciones');
