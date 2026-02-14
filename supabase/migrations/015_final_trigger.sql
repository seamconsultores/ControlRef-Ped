-- Trigger Definitivo y Probado
-- 1. Limpieza
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Función con bloques de seguridad aislados
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  var_aduanas text[] := '{}';
  var_patentes text[] := '{}';
  var_role user_role := 'operativo';
  var_name text := 'Nuevo Usuario';
BEGIN
  -- A. Nombre (Texto simple)
  BEGIN
    var_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario');
  EXCEPTION WHEN OTHERS THEN var_name := 'Nuevo Usuario'; END;

  -- B. Rol (Cast a ENUM)
  BEGIN
    var_role := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN var_role := 'operativo'; END;

  -- C. Aduanas (Intentar iterar como array)
  BEGIN
    SELECT COALESCE(array_agg(x), '{}') INTO var_aduanas 
    FROM jsonb_array_elements_text(new.raw_user_meta_data->'aduana_access') t(x);
  EXCEPTION WHEN OTHERS THEN 
    -- Si falla (por ser null, string o vacío), asignamos vacío
    var_aduanas := '{}'; 
  END;

  -- D. Patentes (Intentar iterar como array)
  BEGIN
    SELECT COALESCE(array_agg(x), '{}') INTO var_patentes 
    FROM jsonb_array_elements_text(new.raw_user_meta_data->'patente_access') t(x);
  EXCEPTION WHEN OTHERS THEN 
    var_patentes := '{}'; 
  END;

  -- E. Insertar (Blindado)
  INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
  VALUES (
    new.id, 
    new.email, 
    var_name,
    var_role,
    var_aduanas,
    var_patentes
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
