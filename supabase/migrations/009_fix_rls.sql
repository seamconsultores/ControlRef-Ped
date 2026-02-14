-- 1. Asegurar que RLS esté habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Management can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 3. Política Maestra de Lectura:
-- "Todo usuario autenticado puede leer SU PROPIO perfil"
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- "Administradores y Directivos pueden leer TODOS los perfiles"
CREATE POLICY "Admins can read all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'director')
  )
);

-- 4. Política Maestra de Escritura:
-- "Solo Administradores pueden crear o editar perfiles de otros"
CREATE POLICY "Admins can insert/update profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 5. Auto-reparación: Asegurar que TU usuario sea Admin sí o sí
-- (Reemplazando el email por el del usuario actual en la ejecución manual,
-- pero aquí dejamos la estructura genérica para que funcione al insertarlo)
-- NOTA: Esto es DML, debería ir separado, pero lo incluimos para asegurar el estado.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'eamador@garbersc.com';
