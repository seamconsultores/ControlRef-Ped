-- 000_init_full.sql
-- Consolidated Schema for Clean Reset
-- Run this in Supabase SQL Editor after dropping all tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'operativo', -- 'admin', 'director', 'gerente', 'coordinador', 'operativo'
  first_name text,
  last_name text,
  aduana text default '240', -- Default context
  patente text default '3834', -- Default context
  -- Access Control Arrays
  access_aduanas text[] default '{}',
  access_patentes text[] default '{}',
  access_clientes text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, first_name, last_name)
  values (
    new.id, 
    new.email, 
    'operativo', 
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. NOTICIAS (News Feed)
create table public.noticias (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  resumen text,
  contenido text,
  imagen_url text, -- Optional image
  link_url text, -- Read More / Source link
  fuente text, -- 'DOF', 'SAT', 'Internal'
  fecha_publicacion timestamptz default now(),
  created_by uuid references public.profiles(id),
  active boolean default true
);

-- RLS for Noticias
alter table public.noticias enable row level security;
create policy "News viewable by authenticated" on noticias for select using (auth.role() = 'authenticated');
create policy "News insertable by admin/marketing" on noticias for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'director', 'gerente'))
);

-- 3. SELLOS FISCALES (Seals)
create table public.sellos_fiscales (
  id uuid default uuid_generate_v4() primary key,
  numero_serie text not null unique,
  patente text not null, -- '3834', etc.
  
  -- Tracking / Ownership
  aduana_id text, -- '240' (Owner Aduana)
  sociedad text, -- 'G&B', 'Agencia X'
  ubicacion text default 'Bodega', -- Location (General)
  asignado_a_ubicacion text, -- Specific allocation: 'Bodega', 'Stock Oficina', 'Socio X'

  -- Status
  estado text default 'disponible' check (estado in ('disponible', 'asignado', 'baja')),
  
  -- Assignment Details
  asignado_a uuid references auth.users(id),
  fecha_asignacion timestamptz,
  cliente text,
  pedimento text, -- Main pedimento
  pedimento_refs text[], -- All pedimentos
  aduana text, -- Aduana where it was used
  caja text,
  placas text,
  
  fecha_creacion timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Indexes
create index idx_sellos_serie on sellos_fiscales(numero_serie);
create index idx_sellos_estado on sellos_fiscales(estado);
create index idx_sellos_patente on sellos_fiscales(patente);
create index idx_sellos_aduana_id on sellos_fiscales(aduana_id);

-- RLS for Seals
alter table public.sellos_fiscales enable row level security;
create policy "Seals viewable by authenticated" on sellos_fiscales for select using (auth.role() = 'authenticated');
create policy "Seals insertable by admins/coords" on sellos_fiscales for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'director', 'gerente', 'coordinador'))
);
create policy "Seals updatable by authenticated" on sellos_fiscales for update using (auth.role() = 'authenticated');

-- 4. ATOMIC ASSIGNMENT FUNCTION (RPC)
-- Ensures race-condition-free assignment
create or replace function assign_next_seal_v2(
  p_patente text,
  p_cliente text,
  p_pedimento text,
  p_aduana text,
  p_caja text,
  p_placas text,
  p_pedimento_refs text[]
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_details jsonb;
  v_seal_id uuid; -- Changed to UUID to match table
  v_user_id uuid;
  v_requester_aduana text; 
begin
  v_user_id := auth.uid();
  
  -- Extract Aduana ID from p_aduana (e.g. '240 - N. LAREDO' -> '240')
  v_requester_aduana := split_part(p_aduana, ' ', 1);

  -- 1. Find next available seal for this Patente & Aduana using SKIP LOCKED
  select id
  into v_seal_id
  from sellos_fiscales
  where estado = 'disponible'
    and patente = p_patente
    and (aduana_id is null or aduana_id = v_requester_aduana) -- Optional: enforce ownership matching
  order by numero_serie asc
  limit 1
  for update skip locked;

  if v_seal_id is null then
    return null;
  end if;

  -- 2. Assign
  update sellos_fiscales
  set
    estado = 'asignado',
    asignado_a = v_user_id,
    fecha_asignacion = now(),
    cliente = p_cliente,
    pedimento = p_pedimento,
    aduana = p_aduana,
    caja = p_caja,
    placas = p_placas,
    pedimento_refs = p_pedimento_refs
  where id = v_seal_id;

  -- 3. Return
  select to_jsonb(s.*) into v_details
  from sellos_fiscales s where id = v_seal_id;
  
  return v_details;
end;
$$;

-- 5. HISTORICAL DATA (Optional)
create table public.pedimentos_historicos (
  id uuid default uuid_generate_v4() primary key,
  referencia text,
  pedimento text,
  aduana text,
  cliente text,
  fecha text, -- Stored as text usually from Excel
  clave text,
  bultos text,
  transporte text,
  guias text,
  imported_at timestamptz default now(),
  imported_by uuid references auth.users(id)
);

alter table public.pedimentos_historicos enable row level security;
create policy "History viewable by auth" on pedimentos_historicos for select using (auth.role() = 'authenticated');

-- 6. PEDIMENTOS (Active - if needed)
-- (Schema depends on original, adding basic structure if user wants it)
create table public.pedimentos (
  id bigint generated always as identity primary key,
  referencia text,
  numero_pedimento text,
  aduana text,
  cliente text,
  fecha_creacion timestamptz default now()
);
alter table public.pedimentos enable row level security;
create policy "Pedimentos viewable by auth" on pedimentos for select using (auth.role() = 'authenticated');
