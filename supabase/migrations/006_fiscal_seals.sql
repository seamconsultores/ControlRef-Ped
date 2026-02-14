-- Create enum for seal status
CREATE TYPE sello_estado AS ENUM ('disponible', 'asignado', 'bloqueado', 'baja');

-- Create seals table
CREATE TABLE IF NOT EXISTS sellos_fiscales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_serie TEXT UNIQUE NOT NULL,
  estado sello_estado DEFAULT 'disponible',
  ubicacion TEXT DEFAULT 'Bodega', -- e.g., 'Caja Fuerte', 'Escritorio Gerente'
  asignado_a UUID REFERENCES profiles(id), -- The operator who requested/received it
  fecha_alta TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  fecha_asignacion TIMESTAMP WITH TIME ZONE,
  pedimento_refs TEXT[], -- Array of strings to store related pedimentos/referencias
  created_by UUID REFERENCES auth.users(id) -- Who created this seal record
);

-- Enable RLS
ALTER TABLE sellos_fiscales ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read: All authenticated users (with valid role) can view seals
CREATE POLICY "Users can view seals" 
  ON sellos_fiscales 
  FOR SELECT 
  USING (auth.role() = 'authenticated'); 
  -- Optionally refine this to only specific roles if needed

-- 2. Insert: Only Admins/Coordinators/Managers can add new seals
CREATE POLICY "Coords can insert seals" 
  ON sellos_fiscales 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'gerente', 'coordinador')
    )
  );

-- 3. Update (Assign): Operators can update specific fields ONLY if status is 'disponible'
-- This is tricky in pure SQL policies for partial updates. 
-- Easier approach: Allow update if user is assigned OR user is coordinator.
CREATE POLICY "Coords can update all seals" 
  ON sellos_fiscales 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'gerente', 'coordinador')
    )
  );

CREATE POLICY "Operators can assign self to available seals" 
  ON sellos_fiscales 
  FOR UPDATE 
  USING (
    -- Can update if currently available OR if already assigned to self (to add refs)
    (estado = 'disponible') OR (asignado_a = auth.uid())
  )
  WITH CHECK (
    -- Ensure they don't change the serial number or unlock a blocked one arbitrarily
    -- This is a weak check, better handled via app logic or a function, but serves as a baseline.
    (estado IN ('asignado', 'disponible')) 
  );

-- Indexes for performance
CREATE INDEX idx_sellos_estado ON sellos_fiscales(estado);
CREATE INDEX idx_sellos_asignado_a ON sellos_fiscales(asignado_a);
CREATE INDEX idx_sellos_serie ON sellos_fiscales(numero_serie);
