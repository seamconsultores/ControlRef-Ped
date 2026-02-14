-- Trigger sin dependencias de tipos (TEXT only)
-- Esto evita errores si el tipo ENUM 'user_role' no existe o da problemas en DECLARE

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  -- Usamos TEXT para evitar errores de tipo en la declaración
  var_role_text text := 'operativo';
  var_name text := 'Nuevo Usuario';
BEGIN
  -- 1. Extraer datos (Todo seguro)
  BEGIN
    var_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario');
    -- Si el rol viene nulo o vacío, usar operativo
    var_role_text := COALESCE(new.raw_user_meta_data->>'role', 'operativo');
  EXCEPTION WHEN OTHERS THEN 
    var_name := 'Usuario Error';
    var_role_text := 'operativo';
  END;

  -- 2. Insertar usando CAST explícito en la sentencia SQL
  -- Esto permite que Postgres maneje la conversión de texto a enum (o texto a texto) según la columna real
  INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
  VALUES (
    new.id, 
    new.email, 
    var_name,
    var_role_text::user_role, -- Intento de cast aquí. Si falla, el EXCEPTION global lo atrapa.
    '{}', 
    '{}' 
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Si falla el cast a user_role (ej: valor inválido), intentamos fallback a 'operativo'
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, aduana_access, patente_access)
    VALUES (
      new.id, new.email, var_name, 'operativo'::user_role, '{}', '{}'
    );
  EXCEPTION WHEN OTHERS THEN
      -- Si falla incluso el fallback, logueamos y dejamos pasar (usuario sin perfil)
      RAISE WARNING 'Error fatal creando perfil: %', SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
