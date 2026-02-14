-- Change columns to arrays
ALTER TABLE public.profiles 
ALTER COLUMN aduana_access TYPE TEXT[] USING string_to_array(aduana_access, ','),
ALTER COLUMN patente_access TYPE TEXT[] USING string_to_array(patente_access, ',');

-- Update function to handle arrays
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  aduanas_json jsonb;
  patentes_json jsonb;
  aduanas_arr text[];
  patentes_arr text[];
BEGIN
  -- Intentar obtener como JSONB
  aduanas_json := new.raw_user_meta_data->'aduana_access';
  patentes_json := new.raw_user_meta_data->'patente_access';

  -- Convertir JSONB array a Text[] si es posible
  -- Si viene como string simple (no array), lo convertimos a array de 1 elemento
  
  IF jsonb_typeof(aduanas_json) = 'array' THEN
    SELECT array_agg(x) INTO aduanas_arr FROM jsonb_array_elements_text(aduanas_json) t(x);
  ELSE
    -- Fallback si viene como texto
    aduanas_arr := ARRAY[new.raw_user_meta_data->>'aduana_access'];
  END IF;

  IF jsonb_typeof(patentes_json) = 'array' THEN
    SELECT array_agg(x) INTO patentes_arr FROM jsonb_array_elements_text(patentes_json) t(x);
  ELSE
    patentes_arr := ARRAY[new.raw_user_meta_data->>'patente_access'];
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'operativo'),
    aduanas_arr,
    patentes_arr
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
