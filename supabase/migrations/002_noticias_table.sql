-- 1. Crear tabla de Noticias
CREATE TABLE IF NOT EXISTS noticias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,    -- Ej: 'AAANLD', 'DOF - SHCP'
    title TEXT NOT NULL,            -- El titular
    date_str VARCHAR(50),           -- Texto libre para la fecha: 'Hoy, 09:00 AM', '08 Feb'
    category VARCHAR(20) NOT NULL,  -- 'operativo', 'fiscal', 'evento'
    color_class VARCHAR(50) DEFAULT 'bg-blue-600', -- Clase de Tailwind para el fondo
    active BOOLEAN DEFAULT true,    -- Para ocultar noticias viejas sin borrarlas
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar seguridad (RLS)
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

-- 3. Política: Todo el mundo puede LEER las noticias activas
CREATE POLICY "Public Read Active News" ON noticias
    FOR SELECT USING (active = true);

-- 4. Insertar datos de ejemplo iniciales (Seed)
INSERT INTO noticias (source, title, date_str, category, color_class) VALUES
('AAANLD', 'Circular G-0024: Nuevos horarios de contingencia en Puente III', 'Hoy, 09:00 AM', 'operativo', 'bg-blue-600'),
('DOF - SHCP', 'Resolución Miscelánea Fiscal: Anexo 29 sobre CFDI con Complemento', 'Ayer', 'fiscal', 'bg-emerald-700'),
('AAANLD', 'Recordatorio: Sesión de Capacitación "Cambios en Reglas Generales"', '08 Feb', 'evento', 'bg-amber-600');
