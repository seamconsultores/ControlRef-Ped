-- Permitir insertar noticias (para que el script funcione con la anon key o service_role)
-- Como estamos usando la anon key en el script, necesitamos permitir insert a public o autenticados.
-- OJO: Idealmente el script usaría SERVICE_ROLE_KEY, pero para simplificar usamos anon.

CREATE POLICY "Enable insert for everyone" ON noticias FOR INSERT WITH CHECK (true);

-- O alternativamente, si prefieres solo lectura publica y escritura privada, deberias usar la service_role key en el script.
-- Pero dado que estamos en desarrollo rapido:
CREATE POLICY "Enable update for everyone" ON noticias FOR UPDATE USING (true);
