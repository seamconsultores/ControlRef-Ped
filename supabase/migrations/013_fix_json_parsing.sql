-- Fix JSON array parsing in handle_new_user
-- This ensures that empty arrays or missing keys don't cause the trigger to fail

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  aduanas_json jsonb;
  patentes_json jsonb;
  aduanas_arr text[];
  patentes_arr text[];
BEGIN
  -- Safe extraction of JSONB
  aduanas_json := new.raw_user_meta_data->'aduana_access';
  patentes_json := new.raw_user_meta_data->'patente_access';

  -- Handle Aduanas
  IF aduanas_json IS NULL OR jsonb_typeof(aduanas_json) = 'null' THEN
    aduanas_arr := '{}';
  ELSIF jsonb_typeof(aduanas_json) = 'array' THEN
    -- COALESCE handles the case where array_agg returns NULL for empty set (though jsonb_array_elements_text on [] returns 0 rows)
    -- Actually array_agg on 0 rows is NULL. So COALESCE is needed.
    SELECT COALESCE(array_agg(x), '{}') INTO aduanas_arr FROM jsonb_array_elements_text(aduanas_json) t(x);
  ELSE
    -- Fallback for string/other
    aduanas_arr := ARRAY[new.raw_user_meta_data->>'aduana_access'];
  END IF;

  -- Handle Patentes
  IF patentes_json IS NULL OR jsonb_typeof(patentes_json) = 'null' THEN
    patentes_arr := '{}';
  ELSIF jsonb_typeof(patentes_json) = 'array' THEN
    SELECT COALESCE(array_agg(x), '{}') INTO patentes_arr FROM jsonb_array_elements_text(patentes_json) t(x);
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
