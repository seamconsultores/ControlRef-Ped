-- Table for legacy Excel data (Read-Only mostly)
CREATE TABLE IF NOT EXISTS public.pedimentos_historicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referencia TEXT,
    pedimento TEXT,
    aduana TEXT,
    cliente TEXT,
    fecha_pago TEXT, -- Text to allow varied Excel formats
    clave TEXT,
    bultos TEXT,
    transporte TEXT,
    guias TEXT,
    valor_dolares TEXT,
    proveedor TEXT,
    semaforo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_hist_referencia ON public.pedimentos_historicos(referencia);
CREATE INDEX IF NOT EXISTS idx_hist_pedimento ON public.pedimentos_historicos(pedimento);
CREATE INDEX IF NOT EXISTS idx_hist_cliente ON public.pedimentos_historicos(cliente);

-- RLS
ALTER TABLE public.pedimentos_historicos ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated users
CREATE POLICY "Users can view historical data" 
ON public.pedimentos_historicos FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert: Admin/Coords only
CREATE POLICY "Admins can upload historical data" 
ON public.pedimentos_historicos FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'director', 'gerente', 'coordinador')
  )
);
