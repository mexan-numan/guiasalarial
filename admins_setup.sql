-- 1. Crear tabla de administradores
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    is_superuser boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Insertar superusuario inicial (Ricardo)
INSERT INTO public.admins (email, password, is_superuser)
VALUES ('ricardo.garrido@numan.la', 'MeXan2026', true)
ON CONFLICT (email) DO NOTHING;

-- 3. Función de Login Segura (Bypass RLS para validación interna)
CREATE OR REPLACE FUNCTION verify_admin_login(input_email text, input_password text)
RETURNS json AS $$
DECLARE
    admin_row record;
BEGIN
    SELECT * FROM admins 
    INTO admin_row 
    WHERE email = input_email AND password = input_password;

    IF admin_row IS NOT NULL THEN
        RETURN json_build_object(
            'success', true, 
            'email', admin_row.email, 
            'is_superuser', admin_row.is_superuser
        );
    ELSE
        RETURN json_build_object('success', false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para crear nuevos admins (Solo permitida para Superusuarios)
CREATE OR REPLACE FUNCTION create_new_admin(new_email text, new_password text, requester_email text)
RETURNS boolean AS $$
DECLARE
    is_super boolean;
BEGIN
    -- Validar si el solicitante es superusuario
    SELECT is_superuser INTO is_super FROM admins WHERE email = requester_email;

    IF is_super THEN
        INSERT INTO admins (email, password) VALUES (new_email, new_password);
        RETURN true;
    ELSE
        RAISE EXCEPTION 'No tienes permisos para crear administradores (requiere Superusuario).';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para listar todos los administradores (Solo Superusuarios)
CREATE OR REPLACE FUNCTION get_all_admins(requester_email text)
RETURNS TABLE (email text, is_superuser boolean, created_at timestamptz) AS $$
DECLARE
    is_super boolean;
BEGIN
    SELECT admins.is_superuser INTO is_super FROM admins WHERE admins.email = requester_email;
    
    IF is_super THEN
        RETURN QUERY SELECT admins.email, admins.is_superuser, admins.created_at FROM admins;
    ELSE
        RAISE EXCEPTION 'No tienes permisos para ver la lista de administradores.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para obtener registros de candidatos (Solo Admins)
CREATE OR REPLACE FUNCTION get_admin_registrations(requester_email text, requester_password text)
RETURNS SETOF registrations AS $$
BEGIN
    -- Validar credenciales del admin
    IF EXISTS (SELECT 1 FROM admins WHERE email = requester_email AND password = requester_password) THEN
        RETURN QUERY SELECT * FROM registrations ORDER BY created_at DESC;
    ELSE
        RAISE EXCEPTION 'Acceso denegado: Credenciales de administrador inválidas.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Activar Seguridad de Nivel de Fila (RLS)
-- Al no crear políticas públicas, nadie con el 'anon' key puede leer la tabla directamente.
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
