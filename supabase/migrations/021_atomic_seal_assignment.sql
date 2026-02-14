-- Function to atomically assign the next available seal for a specific patent
-- Returns the assigned seal record or null if none available
-- V2: Matches frontend call name
create or replace function assign_next_seal_v2(
  p_patente text,
  p_cliente text,
  p_pedimento text, -- Main pedimento
  p_aduana text,
  p_caja text,
  p_placas text,
  p_pedimento_refs text[] -- Array of all pedimentos
) returns jsonb
language plpgsql
security definer -- Runs with privileges of the creator (should be valid for authenticated users)
as $$
declare
  v_details jsonb;
  v_seal_id int;
  v_seal_numero text;
  v_user_id uuid;
begin
  -- Get current user ID
  v_user_id := auth.uid();
  -- We don't strictly need to check for null if RLS handles it, but good for safety
  -- logic continues...

  -- 1. Find the next available seal using SKIP LOCKED to prevent race conditions
  select id, numero_serie
  into v_seal_id, v_seal_numero
  from sellos_fiscales
  where estado = 'disponible'
    and patente = p_patente
  order by numero_serie asc
  limit 1
  for update skip locked;

  -- 2. If no seal found, return null
  if v_seal_id is null then
    return null;
  end if;

  -- 3. Update the seal
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

  -- 4. Return the updated record
  select to_jsonb(s.*) into v_details
  from sellos_fiscales s
  where id = v_seal_id;

  return v_details;
end;
$$;
