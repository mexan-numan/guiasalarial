-- 1. Habilitar la extensión de criptografía avanzada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Modificar la función de login para usar hashing (BCRYPT)
CREATE OR REPLACE FUNCTION verify_admin_login(input_email text, input_password text)
RETURNS json AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Buscar el admin por email
    SELECT id, email, password, is_superuser 
    FROM admins 
    WHERE email = input_email 
    INTO admin_record;

    -- Verificar si existe y si el hash coincide (usando crypt)
    IF admin_record IS NOT NULL AND admin_record.password = crypt(input_password, admin_record.password) THEN
        RETURN json_build_object(
            'success', true,
            'email', admin_record.email,
            'is_superuser', admin_record.is_superuser
        );
    ELSE
        RETURN json_build_object('success', false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Modificar la función de creación de admins para encriptar la contraseña (BCRYPT)
CREATE OR REPLACE FUNCTION create_new_admin(requester_email text, input_email text, input_password text)
RETURNS json AS $$
BEGIN
    -- Validar que el solicitante sea superuser
    IF EXISTS (SELECT 1 FROM admins WHERE email = requester_email AND is_superuser = true) THEN
        -- Insertar el nuevo admin con la contraseña encriptada
        INSERT INTO admins (email, password, is_superuser)
        VALUES (input_email, crypt(input_password, gen_salt('bf')), false);
        
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'message', 'Solo superusuarios pueden crear administradores.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCIÓN ESPECIAL: Resetear contraseña de SuperAdmin (Ricardo) con Hashing
-- Ejecuta esto para asegurar que el Login de Ricardo sea el primero en blindarse.
-- Reemplaza 'MeXan2026' con la contraseña deseada si decides cambiarla.
UPDATE admins 
SET password = crypt('MeXan2026', gen_salt('bf')), is_superuser = true
WHERE email = 'ricardo.garrido@numan.la';

-- Nota: Si Ricardo no existe aún en la tabla, el comando anterior no hará nada.
-- En ese caso, puedes usar este insert inicial (solo una vez):
-- INSERT INTO admins (email, password, is_superuser) 
-- VALUES ('ricardo.garrido@numan.la', crypt('MeXan2026', gen_salt('bf')), true)
-- ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
