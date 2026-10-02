import React, { useState } from 'react';
import { X, Copy, Check, Database, Code, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const SCHEMA_SQL_CONTENT = `-- BASE DE DATOS: Ferretería Almacenes Nor Oriente
-- Motor: MySQL 8.0+
-- Juego de caracteres: utf8mb4 / Collation: utf8mb4_unicode_ci

CREATE TABLE store_settings (
    \`key\` VARCHAR(100) PRIMARY KEY,
    \`value\` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    obra_name VARCHAR(200) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    parent_id VARCHAR(36) NULL,
    icon_name VARCHAR(50) DEFAULT 'Package',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brands (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT NULL,
    origin VARCHAR(100) DEFAULT 'Perú',
    logo_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    INDEX idx_products_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_attributes (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    \`key\` VARCHAR(100) NOT NULL,
    \`value\` VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attributes_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_media (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    type ENUM('image', 'video') NOT NULL DEFAULT 'image',
    url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_media_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    color VARCHAR(30) NOT NULL DEFAULT 'yellow'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_tags (
    product_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    profile_id VARCHAR(36) NOT NULL DEFAULT 'GLOBAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, tag_id, profile_id),
    CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

const SEED_SQL_CONTENT = `-- DATOS SEMILLA: Ferretería Almacenes Nor Oriente
-- Password admin por defecto: Admin123!
INSERT INTO users (id, name, email, password_hash, role) VALUES
('u-admin-1', 'Administrador General', 'admin@ferreteria.test', '$2y$12$K1QeO61E.kUv1E6M97zB0u6j2qJvO2Z5s1G6C1X7T.rYgO7nZgAei', 'admin'),
('u-staff-1', 'Carlos Logística & Ventas', 'ventas@ferreteria.test', '$2y$12$K1QeO61E.kUv1E6M97zB0u6j2qJvO2Z5s1G6C1X7T.rYgO7nZgAei', 'staff');

INSERT INTO categories (id, name, slug, description, parent_id, sort_order) VALUES
('cat-1', 'Cementos', 'cementos', 'Cementos Portland tradicionales y de alta resistencia', NULL, 1),
('cat-2', 'Ladrillos', 'ladrillos', 'Ladrillos King Kong, pandereta y para techo', NULL, 2),
('cat-3', 'Aceros', 'aceros', 'Fierro corrugado, alambre negro y mallas', NULL, 3),
('cat-4', 'Arenas', 'arenas', 'Arena gruesa para asentado y arena fina lavada', NULL, 4),
('cat-5', 'Gravas', 'gravas', 'Piedra chancada 1/2", 3/4" y grava clasificada', NULL, 5),
('cat-6', 'Concretos', 'concretos', 'Mezclas secas embolsadas f\\'c 210 kg/cm²', NULL, 6);

INSERT INTO products (id, name, slug, description, category_id, price, currency, unit, stock, sku) VALUES
('p-1', 'Cemento Portland Gris Tipo I (42.5 kg)', 'cemento-portland-gris-tipo-1', 'Uso general en columnas, vigas y losas.', 'cat-1', 31.50, 'PEN', 'bolsa (42.5 kg)', 450, 'CEM-SOL-T1-425'),
('p-2', 'Ladrillo King Kong 18 Huecos Estructural', 'ladrillo-king-kong-18-huecos', 'Muros portantes antisísmicos.', 'cat-2', 1050.00, 'PEN', 'millar', 18000, 'LAD-KK18-ESTR'),
('p-3', 'Varilla de Acero Corrugado 1/2" Grado 60 (9 m)', 'varilla-acero-corrugado-1-2-grado-60', 'Fierro de 9 metros para armaduras de concreto.', 'cat-3', 46.80, 'PEN', 'varilla (9 m)', 620, 'ACE-COR-050-9M'),
('p-4', 'Arena Gruesa Cernida de Río (m³)', 'arena-gruesa-cernida-m3', 'Agregado fino para concreto estructural.', 'cat-4', 68.00, 'PEN', 'm³', 95, 'ARE-GRU-M3-RIO');`;

interface SqlViewerModalProps {
  onClose: () => void;
}

export const SqlViewerModal: React.FC<SqlViewerModalProps> = ({ onClose }) => {
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState<'schema' | 'seed'>('schema');
  const [copied, setCopied] = useState(false);

  const currentContent = activeTab === 'schema' ? SCHEMA_SQL_CONTENT : SEED_SQL_CONTENT;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      showToast(`Archivo ${activeTab}.sql copiado al portapapeles`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Error al copiar el texto', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
      <div className="bg-stone-900 text-stone-100 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="font-bold text-sm text-stone-100 font-mono">
                /database/{activeTab}.sql (MySQL 8.0)
              </h3>
              <p className="text-[11px] text-stone-400">
                Esquema relacional y datos de prueba para Slim PHP 4 & MySQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-stone-900 border-b border-stone-800 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${
                activeTab === 'schema'
                  ? 'bg-yellow-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              schema.sql (Tablas DDL)
            </button>
            <button
              onClick={() => setActiveTab('seed')}
              className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${
                activeTab === 'seed'
                  ? 'bg-yellow-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              seed.sql (Datos Iniciales)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-[11px] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>

        {/* SQL Code Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-stone-950/80 font-mono text-xs text-yellow-100/90 leading-relaxed whitespace-pre selection:bg-yellow-400 selection:text-black">
          {currentContent}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-[11px] text-stone-400">
          <span>
            Credenciales de Administrador: <code>admin@ferreteria.test</code> / <code>Admin123!</code>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-sans"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
