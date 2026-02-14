-- Solución al error de recursión infinita (42P17)

-- 1. Función de seguridad para checar rol sin disparar RLS (Rompe el ciclo)
CREATE OR REPLACE FUNCTION public.is_admin_or_director()
RETURNS BOOLEAN AS $$
BEGIN
  -- Al ser SECURITY DEFINER, esta consulta corre con permisos de superusuario
  -- y se salta las políticas RLS, evitando el bucle infinito.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'director')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpiar políticas recursivas anteriores
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert/update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 3. Recrear políticas usando la función segura

-- Lectura Global para Admins (Usa la función segura)
CREATE POLICY "Admins can read all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (public.is_admin_or_director());

-- Escritura para Admins (Usa la función segura)
CREATE POLICY "Admins can insert/update profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_admin_or_director())
WITH CHECK (public.is_admin_or_director());

-- Asegurar que los usuarios normales sigan podiendo leerse a sí mismos
-- (Esta política no usa la función porque es simple: ID = ID)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
