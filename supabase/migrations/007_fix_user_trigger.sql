-- Fix for handle_new_user trigger
-- Robustecer la función para manejar nulos y roles inválidos

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  default_role user_role := 'operativo';
  new_role user_role;
BEGIN
  -- Intentar obtener el rol de los metadatos
  BEGIN
    new_role := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    new_role := default_role;
  END;

  -- Si es nulo, usar default
  IF new_role IS NULL THEN
    new_role := default_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    new_role
  );
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
