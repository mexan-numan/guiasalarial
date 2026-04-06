# Informe Técnico: Arquitectura y Estructura - Proyecto Numan

Este documento describe la arquitectura, el stack tecnológico y la organización del código del proyecto **Guía Salarial Numan**, diseñado para facilitar la transferencia de conocimiento a otros desarrolladores.

## 1. Stack Tecnológico (The Stack)

El proyecto está construido bajo una arquitectura de **BaaS (Backend as a Service)** para maximizar la velocidad de respuesta y minimizar la complejidad del servidor.

- **Frontend Core**: HTML5, CSS3 (Vanilla) y JavaScript (ES6+). No utiliza frameworks (React/Vue) para mantener el peso mínimo y máxima compatibilidad.
- **Backend / Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL). Se utiliza para persistencia de datos, autenticación de administradores, almacenamiento de archivos y lógica de servidor mediante funciones SQL/RPCs.
- **Tipografía**: 'Outfit' y 'Montserrat' (Google Fonts).

### Librerías Externas (CDN)
- **Chart.js**: Renderizado de gráficos de tendencias en el Admin.
- **PapaParse**: Procesamiento ultra-rápido de archivos CSV (Lectura y Escritura).
- **EmailJS**: Envío de correos transaccionales (Bienvenida) directamente desde el cliente.
- **Supabase-js SDK**: Interfaz oficial de comunicación con el backend.

---

## 2. Estructura de Archivos

```text
/
├── index.html          # Interfaz principal del Calculador de Sueldos (Público)
├── registro.html       # Formulario de registro multi-campo para candidatos
├── admin.html          # Panel de Administración Central (Dashboard VIP)
├── style.css           # Hoja de estilos global (Layout, Typography, Variables CSS)
├── app.js              # Lógica operativa del calculador (filtros, paginación local)
├── supabase-config.js  # Configuración única del cliente Supabase (API Keys)
├── *.sql               # Scripts de configuración de la Base de Datos
└── *.png / *.webp      # Activos visuales (Logos, imágenes de soporte)
```

---

## 3. Arquitectura de Seguridad (Seguridad Lógica)

La seguridad no se maneja en el cliente (JS), sino en la capa de datos de Supabase:

1.  **Row Level Security (RLS)**: Las tablas `registrations` y `salaries` tienen políticas activas. Los usuarios anónimos solo pueden insertar (registrarse) o seleccionar datos limitados.
2.  **Funciones RPC (Remote Procedure Call)**: Se crearon funciones en PostgreSQL para operaciones críticas. Esto evita exponer tablas sensibles (`admins`) al cliente:
    -   `verify_admin_login`: Valida credenciales sin exponer hashes de contraseña.
    -   `create_new_admin`: Permite que un superusuario registre a otro de forma controlada.
    -   `get_salary_updates_log`: Consulta auditada del historial de cambios.
3.  **Auditoría**: Cada carga de CSV genera un registro en la tabla `salary_updates_log` asociando el email del administrador con la acción.

---

## 4. Guía para el Desarrollador (Developer Onboarding)

### Requisitos Previos
- Acceso al proyecto de Supabase (`mrpchslrqjjlieqsgeca`).
- Conocimiento básico de SQL (PL/pgSQL para funciones RPC).

### Flujo de Datos
1.  **Registro**: `registro.html` captura datos -> `Supabase .insert()`.
2.  **Consulta**: `app.js` consume `salaries` -> Muestra resultados filtrados.
3.  **Admin**: `admin.html` solicita datos vía RPC -> Renderiza tablas y gráficos.

### Mantenimiento de Base de Datos
Para actualizar la guía salarial, el administrador sube un CSV en el Dashboard. El código JS descarga la base actual, borra registros previos e inserta los nuevos en batches optimizados usando PapaParse.

### Convenciones
- **Variables CSS**: Centralizadas en `:root` dentro de `style.css` y `admin.html`.
- **Nomenclatura DB**: `snake_case` para tablas y columnas.
- **Lógica UI**: Basada en clases `.active` y manipulación de DOM directa.

---

> [!TIP]
> **Futuros pasos recomendados**: 
> 1. Migrar `supabase-config.js` a variables de entorno si se utiliza un build tool (Vite/Webpack).
> 2. Implementar un Middleware de servidor si se desea mayor complejidad en los reportes de exportación.
