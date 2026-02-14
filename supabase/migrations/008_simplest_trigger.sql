-- 1. Eliminar trigger y función anteriores para limpiar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Asegurar que la tabla profiles existe (por si acaso)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'operativo', -- Usar TEXT temporalmente para evitar problemas de ENUM
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear función ULTRA SIMPLIFICADA
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Solo insertar ID y Email. Todo lo demás por defecto.
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    'Usuario Nuevo',
    'operativo'
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Si falla, NO bloquear la creación del usuario en auth.users, pero registrar en logs de postgres si fuera posible.
  -- Simplemente retornamos new para que el usuario se cree aunque falle el perfil.
  RAISE WARNING 'Error creando perfil: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-activar Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
