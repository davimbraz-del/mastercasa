-- ==========================================================================
-- Mastercasa Imobiliária — Esquema do banco (Supabase / Postgres)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- ==========================================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
-- Um perfil por usuário autenticado. "role" define se é corretor (admin)
-- ou cliente. Todo cadastro novo nasce como 'cliente'; promover alguém a
-- corretor é feito manualmente (veja o guia de configuração).
create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	name text,
	role text not null default 'cliente' check (role in ('cliente', 'corretor')),
	created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
	for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
	for update using (auth.uid() = id);

-- Cria o perfil automaticamente quando alguém se cadastra pelo Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
	insert into public.profiles (id, name, role)
	values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email), 'cliente');
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ---------- properties ----------
create table if not exists public.properties (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	transaction_type text not null check (transaction_type in ('venda', 'aluguel', 'lancamento')),
	property_type text,
	price numeric,
	size numeric,
	bedrooms integer,
	parking integer,
	location text,
	description text,
	photo_url text,
	meta_text text,
	created_by uuid references public.profiles (id),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

-- Qualquer visitante do site (mesmo sem login) pode ver os imóveis.
create policy "properties_select_all" on public.properties
	for select using (true);

-- Só corretores autenticados podem cadastrar/editar/remover imóveis.
create policy "properties_insert_corretor" on public.properties
	for insert with check (
		exists (select 1 from public.profiles where id = auth.uid() and role = 'corretor')
	);

create policy "properties_update_corretor" on public.properties
	for update using (
		exists (select 1 from public.profiles where id = auth.uid() and role = 'corretor')
	);

create policy "properties_delete_corretor" on public.properties
	for delete using (
		exists (select 1 from public.profiles where id = auth.uid() and role = 'corretor')
	);

-- ---------- favorites ----------
create table if not exists public.favorites (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	property_id uuid not null references public.properties (id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (user_id, property_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
	for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
	for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
	for delete using (auth.uid() = user_id);

-- ---------- Storage: fotos dos imóveis ----------
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "property_photos_public_read" on storage.objects
	for select using (bucket_id = 'property-photos');

create policy "property_photos_corretor_insert" on storage.objects
	for insert with check (
		bucket_id = 'property-photos'
		and exists (select 1 from public.profiles where id = auth.uid() and role = 'corretor')
	);

create policy "property_photos_corretor_update" on storage.objects
	for update using (
		bucket_id = 'property-photos'
		and exists (select 1 from public.profiles where id = auth.uid() and role = 'corretor')
	);

create policy "property_photos_corretor_delete" on storage.objects
	for delete using (
		bucket_id = 'property-photos'
		and exists (select 1 from public.profiles where id = auth.uid() and role = 'corretor')
	);
