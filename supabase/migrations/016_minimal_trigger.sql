-- Trigger MINIMALISTA (Estrategia de 2 pasos)
-- Este trigger solo crea el perfil base. Los arrays se actualizan desde la aplicación.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  var_role user_role := 'operativo';
  var_name text := 'Nuevo Usuario';
BEGIN
  -- Safe Name
  BEGIN
    var_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario');
  EXCEPTION WHEN OTHERS THEN var_name := 'Nuevo Usuario'; END;

  -- Safe Role
  BEGIN
    var_role := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN var_role := 'operativo'; END;

  -- Insert Basic Profile (Empty Arrays)
  INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
  VALUES (
    new.id, 
    new.email, 
    var_name,
    var_role,
    '{}', -- Se llenará despues
    '{}'  -- Se llenará despues
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail auth creation
  RAISE WARNING 'Error base perfil: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
