-- 1. Agregar columna 'referencia' a sellos_fiscales
ALTER TABLE public.sellos_fiscales
ADD COLUMN IF NOT EXISTS referencia TEXT;

-- 2. Índice
CREATE INDEX IF NOT EXISTS idx_sellos_referencia ON public.sellos_fiscales(referencia);
