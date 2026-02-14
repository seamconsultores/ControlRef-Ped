-- 1. Agregar columnas a la tabla sellos_fiscales
ALTER TABLE public.sellos_fiscales
ADD COLUMN IF NOT EXISTS patente TEXT, -- La patente dueña del sello (Inventario)
ADD COLUMN IF NOT EXISTS cliente TEXT, -- Para quien se solicitó
ADD COLUMN IF NOT EXISTS pedimento TEXT, -- Referencia principal
ADD COLUMN IF NOT EXISTS aduana TEXT, -- Aduana de despacho
ADD COLUMN IF NOT EXISTS caja TEXT; -- Identificador de caja/contenedor

-- 2. Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_sellos_patente ON public.sellos_fiscales(patente);
CREATE INDEX IF NOT EXISTS idx_sellos_pedimento ON public.sellos_fiscales(pedimento);

-- 3. Actualizar políticas (no necesario si son las mismas tablas)
-- Simplemente verificamos que existan
