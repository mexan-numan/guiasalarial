-- 1. Crear tabla de logs para actualizaciones de base de datos
CREATE TABLE IF NOT EXISTS salary_updates_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_email TEXT NOT NULL,
    filename TEXT NOT NULL,
    row_count INTEGER NOT NULL
);

-- 2. Activar RLS en la tabla de logs
ALTER TABLE salary_updates_log ENABLE ROW LEVEL SECURITY;

-- 3. Función RPC para obtener el historial (Solo Admins)
CREATE OR REPLACE FUNCTION get_salary_updates_log(requester_email text, requester_password text)
RETURNS SETOF salary_updates_log AS $$
BEGIN
    -- Validar que el solicitante sea un admin
    IF EXISTS (SELECT 1 FROM admins WHERE email = requester_email AND password = requester_password) THEN
        RETURN QUERY SELECT * FROM salary_updates_log ORDER BY created_at DESC;
    ELSE
        RAISE EXCEPTION 'Acceso denegado: Credenciales de administrador inválidas.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Nota: El insert a esta tabla se hará desde el JS de admin.html tras una subida exitosa.
-- Para permitir el INSERT desde el cliente de forma segura, creamos un RPC de inserción o una política restrictiva.
-- Usaremos un RPC para insertar el log de forma atómica con la validación de admin.

CREATE OR REPLACE FUNCTION log_salary_update(
    auth_email text, 
    auth_password text,
    file_name text,
    rows_inserted integer
) RETURNS void AS $$
BEGIN
    -- Validar admin
    IF EXISTS (SELECT 1 FROM admins WHERE email = auth_email AND password = auth_password) THEN
        INSERT INTO salary_updates_log (admin_email, filename, row_count)
        VALUES (auth_email, file_name, rows_inserted);
    ELSE
        RAISE EXCEPTION 'Acceso denegado al registrar el log.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
