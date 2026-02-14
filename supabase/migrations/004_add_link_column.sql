-- Agregar columna para el enlace de la noticia
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS link TEXT;
