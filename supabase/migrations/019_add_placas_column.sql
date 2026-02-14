-- Add placas column to sellos_fiscales
ALTER TABLE public.sellos_fiscales
ADD COLUMN IF NOT EXISTS placas TEXT;

-- Index for searching seals by license plate (optional but good for history)
CREATE INDEX IF NOT EXISTS idx_sellos_placas ON public.sellos_fiscales(placas);
