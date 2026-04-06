# Guía de Migración: Numan a Hostinger

Este informe detalla el proceso para desplegar el proyecto **Guía Salarial Numan** en los servidores de Hostinger. Dado que el proyecto es una aplicación de frontend estática conectada a un backend de Supabase (BaaS), el proceso es ágil y seguro.

## 1. Preparación de Archivos

Hostinger utiliza un servidor web (usualmente Apache o LiteSpeed). Asegúrate de tener la carpeta raíz con los siguientes archivos mínimos:
- `index.html` (El calculador)
- `registro.html` (El registro)
- `admin.html` (El dashboard)
- `style.css`
- `app.js`
- `supabase-config.js` (Archivo crítico para la conexión)
- `arquitectura_proyecto.md` (Para referencia futura)

---

## 2. Despliegue en Hostinger (Paso a Paso)

### Paso 1: Subida de Archivos
1. Entra a tu panel de **hPanel** en Hostinger.
2. Ve a **Administrador de Archivos (File Manager)**.
3. Entra en la carpeta `public_html`.
4. Sube todos los archivos del proyecto directamente ahí. 
   > [!TIP]
   > Si usas Git, Hostinger tiene una herramienta de **Auto-Despliegue Git** en el panel; puedes conectar tu repositorio de GitHub directamente para que cada "Push" actualice la web automáticamente.

### Paso 2: Configuración de Dominio y SSL
1. Asegúrate de que el dominio (ej: `numan.la` o un subdominio) apunte a Hostinger.
2. En el panel de Hostinger, busca la sección **Seguridad -> SSL**.
3. Instala el certificado SSL gratuito (Let's Encrypt). 
   > [!IMPORTANT]
   > El sitio **DEBE** cargar con `https://`, de lo contrario, Supabase podría bloquear las peticiones por seguridad.

### Paso 3: Configuración de CORS en Supabase (CRÍTICO)
Como ahora la web vive en un dominio nuevo (Hostinguer), debes autorizarlo en tu base de datos:
1. Ve al Dashboard de **Supabase -> Project Settings -> API**.
2. Busca la sección **CORS (Allowed Origins)**.
3. Añade tu dominio de Hostinger (ej: `https://tu-dominio.com`). 
4. Esto permitirá que el navegador acepte las respuestas de la base de datos desde ese dominio específico.

---

## 3. Consideraciones Técnicas y de Seguridad

### Variables de Conexión
En el archivo `supabase-config.js`, asegúrate de que tanto la `SUPABASE_URL` como la `SUPABASE_ANON_KEY` sean las correctas. Al ser un frontend estático, Hostinger no ofrece un panel de "Variables de Entorno" que se inyecten en el JS del cliente; por lo tanto, las llaves deben permanecer en ese archivo. 
> [!NOTE]
> No hay riesgo en que las llaves estén en el JS siempre y cuando las **RLS (Row Level Security)** estén activas en Supabase (lo cual ya configuramos hoy).

### Caché del Navegador
Hostinger suele usar caché agresiva para archivos estáticos (CSS/JS). Tras subir una actualización, si no ves los cambios, usa **Control + F5** en tu navegador o purga la caché desde el hPanel.

### Base de Datos SQL
No es necesario migrar nada de base de datos a Hostinger. Todo seguirá viviendo en Supabase, lo que garantiza que si el hosting de archivos falla, tus datos siguen seguros y accesibles en la nube de nivel corporativo.

---

## 4. Checklist Final de Migración
- [ ] Archivos subidos a `public_html`.
- [ ] SSL (HTTPS) activo y verde.
- [ ] Dominio añadido en la sección CORS de Supabase.
- [ ] Prueba de registro exitosa desde el nuevo dominio. 
- [ ] Prueba de login exitosa en el Dashboard de admin.

---
**Informe finalizado.** El proyecto está listo para ser productivo en Hostinger.
