-- 1. Limpieza de versiones previas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Definición de la función robusta
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  aduanas_arr text[] := '{}';
  patentes_arr text[] := '{}';
  user_role_val user_role := 'operativo';
  meta_aad jsonb;
  meta_pat jsonb;
BEGIN
  -- Extracción segura de metadatos
  meta_aad := new.raw_user_meta_data->'aduana_access';
  meta_pat := new.raw_user_meta_data->'patente_access';

  -- 1. Intentar Parsear Aduanas (Array o String)
  BEGIN
    IF jsonb_typeof(meta_aad) = 'array' THEN
      SELECT array_agg(x) INTO aduanas_arr 
      FROM jsonb_array_elements_text(meta_aad) t(x);
    ELSIF jsonb_typeof(meta_aad) = 'string' THEN
       -- Si viene como string simple, lo convertimos a array de 1 elemento (sin comillas extra)
       aduanas_arr := ARRAY[new.raw_user_meta_data->>'aduana_access'];
    END IF;
  EXCEPTION WHEN OTHERS THEN
    aduanas_arr := '{}'; -- En caso de error, array vacío
  END;

  -- 2. Intentar Parsear Patentes
  BEGIN
    IF jsonb_typeof(meta_pat) = 'array' THEN
      SELECT array_agg(x) INTO patentes_arr 
      FROM jsonb_array_elements_text(meta_pat) t(x);
    ELSIF jsonb_typeof(meta_pat) = 'string' THEN
       patentes_arr := ARRAY[new.raw_user_meta_data->>'patente_access'];
    END IF;
  EXCEPTION WHEN OTHERS THEN
    patentes_arr := '{}';
  END;

  -- 3. Intentar Parsear Rol
  BEGIN
    user_role_val := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role_val := 'operativo'; -- Fallback seguro
  END;

  -- 4. Insertar Perfil
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
      COALESCE(user_role_val, 'operativo'),
      COALESCE(aduanas_arr, '{}'),
      COALESCE(patentes_arr, '{}')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Logs del error en Postgres (visible en Dashboard > Logs)
    RAISE WARNING 'Error creando perfil para %: %', new.email, SQLERRM;
    -- IMPORTANTE: No retornamos NULL ni lanzamos error para no bloquear auth.users
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reactivar el Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
