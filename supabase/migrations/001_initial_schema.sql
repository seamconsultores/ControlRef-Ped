-- Create Pedimentos Table
create table public.pedimentos (
  id uuid default gen_random_uuid() primary key,
  referencia varchar(20) not null unique,
  aduana varchar(3) not null,
  patente varchar(4) not null,
  numero_pedimento varchar(20) not null,
  cliente varchar(100) not null,
  proveedor varchar(100) not null,
  tipo_operacion varchar(10) not null check (tipo_operacion in ('IMP', 'EXP')),
  clave_pedimento varchar(5) not null,
  caja varchar(20),
  placas varchar(20),
  es_inbond boolean default false,
  estado varchar(20) default 'BORRADOR',
  usuario_id uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.pedimentos enable row level security;

-- Create policy to allow authenticated users to view all pedimentos (for now)
create policy "Allow read access for authenticated users"
on public.pedimentos for select
to authenticated
using (true);

-- Create policy to allow authenticated users to insert
create policy "Allow insert access for authenticated users"
on public.pedimentos for insert
to authenticated
with check (true);


-- Create Consecutivos Table
create table public.consecutivos (
  id serial primary key,
  anio varchar(2) not null,
  aduana varchar(3) not null,
  patente varchar(4) not null,
  siguiente_secuencia integer not null default 1,
  updated_at timestamptz default now(),
  unique(anio, aduana, patente)
);

-- Function to get next reference (Atomic UPSERT)
create or replace function public.obtener_siguiente_consecutivo(
  p_anio varchar,
  p_aduana varchar,
  p_patente varchar
) returns integer as $$
declare
  v_secuencia integer;
begin
  -- Atomic UPSERT:
  -- If row exists: increment next_sequence and return the OLD value (the one we grabbed).
  -- If row missing: insert next_sequence=2 (so we use 1) and return 1.
  
  insert into public.consecutivos (anio, aduana, patente, siguiente_secuencia)
  values (p_anio, p_aduana, p_patente, 2)
  on conflict (anio, aduana, patente) do update
  set siguiente_secuencia = consecut.siguiente_secuencia + 1,
      updated_at = now()
  returning siguiente_secuencia - 1 into v_secuencia;
  
  -- If insert happened (no update), returning clause of UPDATE might not fire in some PG versions if it was INSERT path?
  -- Wait, ON CONFLICT DO UPDATE always fires UPDATE if conflict.
  -- But if NO conflict (INSERT), it does INSERT.
  -- RETURNING in INSERT ... ON CONFLICT ... RETURNING works for both?
  -- No, standard PG doesn't support returning from the "non-executed" path easily.
  
  -- Improved Logic for PG compatibility:
  -- 1. Try Update
  update public.consecutivos
  set siguiente_secuencia = siguiente_secuencia + 1,
      updated_at = now()
  where anio = p_anio and aduana = p_aduana and patente = p_patente
  returning siguiente_secuencia - 1 into v_secuencia;
  
  -- 2. If no row updated, Insert
  if not found then
    insert into public.consecutivos (anio, aduana, patente, siguiente_secuencia)
    values (p_anio, p_aduana, p_patente, 2)
    returning 1 into v_secuencia;
  end if;
  
  return v_secuencia;
end;
$$ language plpgsql;
