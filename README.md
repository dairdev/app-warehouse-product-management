# Ferretería Almacenes Nor Oriente — Gestor de Productos y Catálogo para Clientes

Aplicación web completa y moderna para ferreterías y almacenes de **materiales de construcción pesada** (cementos, ladrillos, concretos, arenas, gravas y aceros). Permite al personal administrativo gestionar el catálogo y especificaciones técnicas (EAV), y a los clientes explorar el catálogo **sin necesidad de iniciar sesión**, etiquetar materiales para sus obras y exportar o compartir cotizaciones.

---

## 🏗️ 1. Estructura del Proyecto

```text
/
├── database/
│   ├── schema.sql           # Esquema DDL para MySQL 8.0 (10 tablas con FK e índices)
│   └── seed.sql             # Datos iniciales (admin, categorías, productos y atributos)
├── src/
│   ├── assets/
│   │   ├── logo.svg         # Logotipo vectorial oficial (Almacenes Nor Oriente)
│   │   └── images/          # Fotografías de cementos, ladrillos, fierro y agregados
│   ├── components/
│   │   ├── Header.tsx       # Barra de navegación con contrato de 3 zonas y selector de rol
│   │   ├── Logo.tsx         # Componente de marca oficial (Almacenes Nor Oriente)
│   │   ├── ProductCard.tsx  # Tarjeta de producto con disciplina zero-pill y metadatos limpios
│   │   ├── ProductFormModal.tsx # Formulario CRUD de productos con atributos dinámicos EAV
│   │   ├── ShareMenu.tsx    # Modal para compartir por WhatsApp, Telegram, Email y enlace
│   │   ├── TagModal.tsx     # Modal para etiquetar materiales con perfil liviano de obra
│   │   ├── SqlViewerModal.tsx # Visor interactivo integrado de schema.sql y seed.sql
│   │   └── ToastContainer.tsx # Notificaciones flotantes del sistema
│   ├── context/
│   │   └── StoreContext.tsx # Estado global con persistencia en localStorage y CRUD completo
│   ├── data/
│   │   └── initialData.ts   # Catálogo inicial con materiales de construcción certificados
│   ├── pages/
│   │   ├── CatalogView.tsx         # Catálogo público con filtros, búsqueda y exportación PDF
│   │   ├── ProductDetailView.tsx   # Ficha técnica detallada, fotos/video y parámetros
│   │   ├── ClientProfileView.tsx   # Perfil liviano de obra y cotizador para WhatsApp
│   │   ├── AdminDashboardView.tsx  # Panel administrativo con KPIs, productos, categorías y usuarios
│   │   ├── LoginView.tsx           # Acceso de personal con botones de demo instantáneos
│   │   ├── RecoverPasswordView.tsx # Recuperación de contraseña por email
│   │   └── PrintCatalogView.tsx    # Vista optimizada para impresión A4 y guardado a PDF
│   ├── types/
│   │   └── index.ts         # Interfaces TypeScript (Product, Category, Attribute, User, etc.)
│   ├── utils/
│   │   ├── pdfExport.ts     # Generación de PDF con jsPDF y vista imprimible nativa
│   │   └── shareUtils.ts    # Generación de mensajes y enlaces de WhatsApp y Telegram
│   ├── App.tsx              # Enrutador principal y layout
│   ├── index.css            # Estilos Tailwind CSS v4 y directivas de impresión A4
│   └── main.tsx             # Punto de entrada de React
├── index.html               # Plantilla HTML con tipografía y metaetiquetas OpenGraph
├── metadata.json            # Metadatos del applet
├── package.json             # Dependencias del proyecto
├── tsconfig.json            # Configuración TypeScript
└── vite.config.ts           # Configuración Vite
```

---

## 🔑 2. Credenciales por Defecto

| Rol | Correo Electrónico | Contraseña | Acceso |
|---|---|---|---|
| **Administrador** | `admin@ferreteria.test` | `Admin123!` | Control total, KPIs, productos, categorías, usuarios |
| **Personal (Staff)** | `ventas@ferreteria.test` | `Admin123!` | Gestión de productos, stock y precios |
| **Cliente / Público** | *Sin login requerido* | *N/A* | Navegación libre, fichas técnicas y etiquetas de obra |

> *Nota:* Desde el botón en el encabezado también puedes alternar entre **Modo Cliente (Público)**, **Personal de Ventas** y **Administrador Central** con un solo clic.

---

## 🗄️ 3. Base de Datos (MySQL 8.0)

Los scripts listos para producción se encuentran en la carpeta `/database`:

1. **`schema.sql`**:
   - `users`: Cuentas con roles (`admin`, `staff`, `client`) y hash de contraseñas.
   - `profiles`: Datos de obra, contacto y notas adicionales.
   - `categories`: Estructura jerárquica con `parent_id` autorreferencial para categorías y subcategorías.
   - `products`: Catálogo con SKU, precio, moneda (PEN / USD), unidad de despacho y stock.
   - `product_attributes`: Patrón EAV para especificaciones técnicas (peso, dimensiones, rendimiento, resistencia).
   - `product_media`: Soporte para fotos y videos clasificados por orden.
   - `tags`: Etiquetas del sistema y personalizadas.
   - `product_tags`: Relación muchos a muchos para el etiquetado por perfil de obra o cliente.
   - `password_resets`: Tokens de recuperación con expiración.
   - `audit_log`: Registro de eventos y cambios administrativos.

2. **`seed.sql`**:
   - Contiene la carga inicial de los productos de construcción más demandados:
     - Cementos Portland Gris Tipo I y Tipo V resistente a sulfatos
     - Ladrillos King Kong 18 Huecos y Pandereta
     - Fierro Corrugado de 1/2" y 3/8" Grado 60
     - Alambre negro recocido #16
     - Arena Gruesa de río y Arena Fina para tarrajeo
     - Piedra Chancada de 1/2" para concreto

---

## 📱 4. Características Principales

- **Catálogo Público Sin Login (`/catalogo`)**: Búsqueda en tiempo real por nombre, SKU, resistencia o medidas; filtrado por categorías, subcategorías y etiquetas de obra.
- **Ficha Técnica Detallada (`/catalogo/producto/:id`)**: Galería de fotos con alta resolución, vista demostrativa de ensayo en video, tabla de parámetros técnicos (NTP / ASTM) y módulo de compra/cotización sticky.
- **Perfil de Obra y Etiquetas de Cliente (`/cliente`)**: Guarda productos con etiquetas como `#Favorito`, `#Cimentacion`, `#Acabados` o etiquetas personalizadas, calculando el importe total y permitiendo enviar la cotización con 1 clic a WhatsApp.
- **Exportación a PDF**:
  - Catálogo completo con portada oficial, índice y fichas.
  - Ficha técnica individual lista para enviar a residentes o supervisores de obra.
  - Formato A4 con directivas CSS `@media print` para impresión sin elementos de UI sobrantes.
- **Compartir por Redes**:
  - WhatsApp: Mensaje con formato enriquecido (negritas, viñetas, SKU, especificaciones y enlace).
  - Telegram, Email (formulario directo + mailto) y copiar enlace.
- **Panel Administrativo (`/admin`)**: Métricas de inventario (KPIs), detección automática de stock bajo, creación y edición rápida de materiales con autogenerador de SKU y gestión de categorías.
- **Visor de Base de Datos**: Botón `schema.sql` en el encabezado para inspeccionar y copiar el código DDL y DML en cualquier momento.

---

## 🚀 5. Cómo Usar la Aplicación

1. **Explorar el catálogo**: Navega por las categorías de *Cementos*, *Ladrillos*, *Aceros*, *Arenas*, *Gravas* o usa el buscador para encontrar materiales específicos.
2. **Consultar ficha técnica**: Haz clic en cualquier material para ver sus medidas exactas, peso, resistencia a la compresión y normas técnicas.
3. **Etiquetar materiales**: Haz clic en el ícono de marcador en cualquier tarjeta para agregarlo a tu perfil de obra (ej. *"Cimentación"* o *"Por Cotizar"*).
4. **Cotizar por WhatsApp**: En tu perfil de obra (`Mi Perfil & Etiquetas`), haz clic en *"Enviar Cotización por WhatsApp"* para enviar la lista valorizada a la ferretería.
5. **Descargar PDF**: Haz clic en *"Descargar Catálogo Completo (PDF)"* o *"Descargar Ficha Técnica PDF Oficial"* para obtener el documento impreso o digital.
6. **Administrar la tienda**: Haz clic en *"Acceso Personal"* en el encabezado, inicia sesión con `admin@ferreteria.test` y accede al panel para agregar o editar productos, gestionar stock y categorías.
