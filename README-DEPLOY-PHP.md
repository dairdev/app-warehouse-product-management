# Guía de Despliegue en Servidor PHP sin Node.js
### Ferretería Almacenes Nor Oriente

Si tu servidor de hosting o producción **NO permite ni tiene instalado Node.js**, **SÍ puedes utilizar la aplicación al 100%**.

---

## ¿Por qué funciona sin Node.js en el servidor?

1. **El Frontend (React SPA)** se compila una sola vez en tu computadora local o pipeline de integración continua con el comando `npm run build`. El resultado son archivos estáticos estándar (**HTML, JavaScript y CSS**) que no requieren ningún intérprete de Node.js en el servidor.
2. **El Backend (Slim Framework 4)** está desarrollado en **PHP puro** (PHP 7.4 / 8.0 / 8.1 / 8.2 / 8.3) y se encarga de:
   - Atender todas las peticiones a la API RESTful (`/api/products`, `/api/categories`, `/api/settings`, etc.).
   - Conectar con la base de datos (SQLite transaccional o MySQL).
   - Servir el archivo `index.html` y los recursos estáticos cuando un usuario entra a cualquier sección del catálogo.
3. El archivo `.htaccess` provisto le dice a **Apache** o **LiteSpeed** (los servidores estándar de cPanel) que entregue los archivos estáticos directamente a máxima velocidad y enrute la API a PHP.

---

## Estructura para el Servidor de Hosting

Cuando subas tu proyecto, la carpeta lista para producción es `backend/`:

```text
backend/
├── public/                 <-- Raíz web pública (DocumentRoot o public_html)
│   ├── .htaccess          <-- Reglas de enrutamiento Apache + Gzip
│   ├── index.php          <-- Enrutador Slim PHP 4 + Fallback SPA
│   ├── index.html         <-- Frontend React compilado
│   └── assets/            <-- Archivos JS, CSS, imágenes y fuentes
├── src/                   <-- Controladores, Modelos y Configuración PHP
│   ├── Controllers/
│   ├── Middleware/
│   └── Config/
├── data/
│   └── ferreteria.sqlite  <-- Base de datos persistente (permisos 775 o 777)
└── vendor/                <-- Dependencias Composer de Slim 4
```

---

## Pasos para Desplegar en cPanel / Hosting Compartido (Apache)

### Paso 1: Generar los archivos estáticos en tu PC
En tu computadora de desarrollo ejecuta:
```bash
npm run build
```
*Este comando compila el frontend e inmediatamente copia los archivos (`index.html` y `assets/`) dentro de `backend/public/`.*

### Paso 2: Subir a tu Hosting
1. Abre tu **cPanel** > **Administrador de Archivos** (o conéctate por **FTP** con FileZilla).
2. Sube la carpeta `backend/` a tu servidor.
3. Si vas a usar el dominio principal, coloca los archivos que están dentro de `backend/public/` directamente dentro de tu carpeta `public_html/`, y la carpeta `src/`, `data/` y `vendor/` un nivel arriba (o dentro del mismo directorio).

### Paso 3: Permisos de Escritura para la Base de Datos
Asegúrate de que la carpeta `backend/data/` y el archivo `ferreteria.sqlite` tengan permisos de lectura y escritura (`chmod 775` o `chmod 777` en cPanel) para que PHP pueda registrar productos, ventas y configuraciones.

### (Opcional) Usar MySQL en lugar de SQLite
Si prefieres usar una base de datos MySQL creada en cPanel:
1. Crea tu base de datos y usuario en cPanel > **Bases de datos MySQL**.
2. Importa el archivo `src/data/schema.sql`.
3. Configura las variables de entorno en un archivo `.env` o en tu servidor:
```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_NAME=nombre_de_tu_bd
DB_USER=usuario_mysql
DB_PASSWORD=contrasena_mysql
```

---

## Configuración para Nginx (VPS / Cloud)

Si usas un servidor Linux con Nginx en lugar de Apache:
1. Copia la plantilla provista en `backend/nginx.conf.example`.
2. Asigna la directiva `root` a la ruta absoluta de `backend/public`.
3. Configura PHP-FPM con `fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;`.
4. Reinicia Nginx: `sudo systemctl reload nginx`.

---

## Integración con GitHub (Despliegue Automático para Subdominio en `/public_html/tienda`)

Tu setup está configurado para desplegar hacia la carpeta **`/public_html/tienda`** correspondiente al subdominio (por ejemplo `tienda.tudominio.com`):

### 1. Opción A: GitHub Actions (Automatizado en `.github/workflows/deploy.yml`)
1. Cada vez que hagas `git push` a `main`, GitHub compila el frontend con Node.js y descarga las dependencias de Slim PHP con Composer.
2. La acción empaqueta la versión lista para producción en `dist_tienda` y la envía a **`/public_html/tienda/`**.
3. **Para activar el envío automático por FTP a tu hosting**:
   - En tu repositorio de GitHub ve a **Settings** > **Secrets and variables** > **Actions**.
   - Añade los siguientes 3 secretos:
     - `FTP_SERVER`: Tu servidor o IP (ej. `ftp.tudominio.com` o la IP de tu cPanel).
     - `FTP_USERNAME`: Tu usuario de cPanel o de la cuenta FTP asignada a `/public_html/tienda`.
     - `FTP_PASSWORD`: Tu contraseña FTP.
4. El workflow desplegará automáticamente los archivos en `/public_html/tienda/` preservando la base de datos y sin sobreescribir datos vivos.

### 2. Opción B: Módulo Git de cPanel (`.cpanel.yml`)
Si prefieres usar la herramienta **Control de Versiones Git** de cPanel:
1. Hemos configurado `.cpanel.yml` con la ruta de destino:
   `export DEPLOYPATH=/home/$USER/public_html/tienda`
2. En tu cPanel ve a **Git Version Control** > Clona o vincula el repositorio de GitHub.
3. Al pulsar **Deploy HEAD Commit** (o recibir el webhook de GitHub), cPanel copiará automáticamente el frontend y la API directamente a `/public_html/tienda/`.

### Estructura desplegada en `/public_html/tienda/`:
```text
/public_html/tienda/
├── index.html          <-- React SPA compilado
├── index.php           <-- Enrutador Slim PHP 4 (API RESTful + Fallback SPA)
├── .htaccess           <-- Reglas Apache, caché Gzip y protección de datos
├── assets/             <-- Archivos JS, CSS, fuentes e imágenes
├── src/                <-- Controladores y modelos PHP (protegido contra acceso directo)
├── vendor/             <-- Dependencias de Slim Framework
└── data/
    ├── .htaccess       <-- Bloquea descarga directa del archivo sqlite
    └── ferreteria.sqlite <-- Base de datos persistente SQLite
```

---

## Resumen
- **En tu computadora o en GitHub Actions:** Se compila el proyecto (`npm run build`).
- **En tu servidor:** **0% Node.js**. Solo se necesita PHP y tu servidor web (Apache o Nginx).
