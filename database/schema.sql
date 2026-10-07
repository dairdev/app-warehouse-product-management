-- ============================================================
-- BASE DE DATOS: Ferretería Almacenes Nor Oriente
-- Motor: MySQL 8.0+
-- Juego de caracteres: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS machinery_rental_requests;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS machineries;
DROP TABLE IF EXISTS machinery_brands;
DROP TABLE IF EXISTS product_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS product_media;
DROP TABLE IF EXISTS product_attributes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS store_settings;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla de Configuración de la Tienda
CREATE TABLE store_settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Usuarios (staff, admin, clientes)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'client') NOT NULL DEFAULT 'client',
    phone VARCHAR(30) NULL,
    company VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Perfiles extendidos
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    obra_name VARCHAR(200) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profiles_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Recuperación de contraseñas
CREATE TABLE password_resets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resets_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Categorías y Subcategorías jerárquicas (parent_id auto-referencial)
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    parent_id VARCHAR(36) NULL,
    icon_name VARCHAR(50) DEFAULT 'Package',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Marcas de Fabricantes (Materiales de Construcción - Sin país de origen)
CREATE TABLE brands (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT NULL,
    logo_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brands_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.1 Marcas de Maquinaria y Equipos Pesados
CREATE TABLE machinery_brands (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'pesada',
    description TEXT NULL,
    logo_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_machinery_brands_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 Flota de Maquinaria y Equipos de Construcción (Alquiler)
CREATE TABLE machineries (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('pesada', 'liviana', 'concreto', 'compactacion', 'transporte') NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    brand VARCHAR(150) NOT NULL,
    brand_id VARCHAR(100) NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    power VARCHAR(100) NULL,
    capacity VARCHAR(100) NULL,
    rate_hourly DECIMAL(10,2) NULL,
    rate_daily DECIMAL(10,2) NULL,
    rate_monthly DECIMAL(10,2) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'PEN',
    fuel_type VARCHAR(50) NULL,
    includes_operator TINYINT(1) DEFAULT 1,
    min_rental_hours INT DEFAULT 8,
    features JSON NULL,
    specifications JSON NULL,
    image_url TEXT NULL,
    photos JSON NULL,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_machineries_brand FOREIGN KEY (brand_id) REFERENCES machinery_brands(id) ON DELETE SET NULL,
    INDEX idx_machineries_category (category),
    INDEX idx_machineries_brand (brand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.3 Cartera Comercial de Clientes (Gestión, RUC/DNI, Obras y Alquileres)
CREATE TABLE clients (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(150) NULL,
    document_type ENUM('DNI', 'RUC', 'CE') DEFAULT 'RUC',
    document_number VARCHAR(30) NULL,
    address TEXT NULL,
    notes TEXT NULL,
    user_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_clients_email (email),
    INDEX idx_clients_phone (phone),
    INDEX idx_clients_document (document_number),
    INDEX idx_clients_company (company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.4 Solicitudes de Alquiler de Maquinaria (Gestión y Calendario de Reservas)
CREATE TABLE machinery_rental_requests (
    id VARCHAR(100) PRIMARY KEY,
    machinery_id VARCHAR(100) NOT NULL,
    machinery_name VARCHAR(255) NOT NULL,
    machinery_brand VARCHAR(150) NULL,
    machinery_model VARCHAR(100) NULL,
    machinery_image_url TEXT NULL,
    client_id VARCHAR(100) NULL,
    client_name VARCHAR(150) NOT NULL,
    client_email VARCHAR(191) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    obra_location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_hour VARCHAR(20) DEFAULT '08:00',
    end_hour VARCHAR(20) DEFAULT '17:00',
    total_hours_or_days VARCHAR(100) NULL,
    needs_operator TINYINT(1) DEFAULT 1,
    notes TEXT NULL,
    created_by ENUM('client', 'admin') NOT NULL DEFAULT 'client',
    status ENUM('pending', 'approved', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(150) NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rentals_machinery FOREIGN KEY (machinery_id) REFERENCES machineries(id) ON DELETE CASCADE,
    CONSTRAINT fk_rentals_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    INDEX idx_rentals_status (status),
    INDEX idx_rentals_dates (start_date, end_date),
    INDEX idx_rentals_machinery (machinery_id),
    INDEX idx_rentals_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Productos de Construcción
CREATE TABLE products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category_id VARCHAR(100) NOT NULL,
    subcategory_id VARCHAR(100) NULL,
    brand_id VARCHAR(100) NULL,
    brand_name VARCHAR(150) NULL,
    presentation VARCHAR(100) NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'PEN',
    unit VARCHAR(50) NOT NULL DEFAULT 'unidad',
    stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 10,
    sku VARCHAR(100) NULL,
    featured TINYINT(1) DEFAULT 0,
    attributes JSON NULL,
    media JSON NULL,
    tags JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_subcategory (subcategory_id),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_sku (sku),
    INDEX idx_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Atributos Técnicos de Productos (EAV Pattern para peso, dimensiones, resistencia)
CREATE TABLE product_attributes (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attributes_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_attributes_product (product_id),
    INDEX idx_attributes_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Medios (Fotos y Videos de productos)
CREATE TABLE product_media (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    type ENUM('image', 'video') NOT NULL DEFAULT 'image',
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    title VARCHAR(150) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_media_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Etiquetas
CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    color VARCHAR(30) NOT NULL DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Etiquetas de Productos asignadas por clientes o staff
CREATE TABLE product_tags (
    product_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    profile_id VARCHAR(36) NOT NULL DEFAULT 'GLOBAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, tag_id, profile_id),
    CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    INDEX idx_pt_profile (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Registro de auditoría
CREATE TABLE audit_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
