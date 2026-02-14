-- Eliminar noticias antiguas que no tienen enlace
DELETE FROM noticias WHERE link IS NULL;

-- Asegurar que las noticias nuevas estén activas
UPDATE noticias SET active = true WHERE link IS NOT NULL;
