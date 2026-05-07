create table if not exists public.cotizaciones_auditoria (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  accion text not null check (accion in ('view', 'download')),
  usuario text not null default 'anonimo',
  ip text null,
  user_agent text null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists cotizaciones_auditoria_cotizacion_id_idx
on public.cotizaciones_auditoria (cotizacion_id, created_at desc);

create index if not exists cotizaciones_auditoria_usuario_idx
on public.cotizaciones_auditoria (usuario, created_at desc);

alter table public.cotizaciones_auditoria enable row level security;

drop policy if exists "cotizaciones_auditoria_public_insert" on public.cotizaciones_auditoria;
create policy "cotizaciones_auditoria_public_insert"
on public.cotizaciones_auditoria
for insert
to anon
with check (true);
