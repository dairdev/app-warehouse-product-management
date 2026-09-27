-- ============================================================
-- DATOS SEMILLA: Ferretería Almacenes Nor Oriente
-- Contraseña Admin por defecto: Admin123!
-- Hash Bcrypt: $2y$12$K1QeO61E.kUv1E6M97zB0u6j2qJvO2Z5s1G6C1X7T.rYgO7nZgAei
-- ============================================================

-- 1. Usuario Admin y Personal
INSERT INTO users (id, name, email, password_hash, role, phone, company) VALUES
('u-admin-1', 'Administrador General', 'admin@ferreteria.test', '$2y$12$K1QeO61E.kUv1E6M97zB0u6j2qJvO2Z5s1G6C1X7T.rYgO7nZgAei', 'admin', '+51 987 654 321', 'Almacenes Nor Oriente S.A.C.'),
('u-staff-1', 'Carlos Logística & Ventas', 'ventas@ferreteria.test', '$2y$12$K1QeO61E.kUv1E6M97zB0u6j2qJvO2Z5s1G6C1X7T.rYgO7nZgAei', 'staff', '+51 976 543 210', 'Almacenes Nor Oriente S.A.C.');

-- 2. Categorías Principales
INSERT INTO categories (id, name, slug, description, parent_id, sort_order) VALUES
('cat-1', 'Cementos', 'cementos', 'Cementos Portland tradicionales y de alta resistencia', NULL, 1),
('cat-2', 'Ladrillos', 'ladrillos', 'Ladrillos King Kong, pandereta y para techo aligerado', NULL, 2),
('cat-3', 'Aceros', 'aceros', 'Fierro corrugado, alambre negro y mallas electrosoldadas', NULL, 3),
('cat-4', 'Arenas', 'arenas', 'Arena gruesa para asentado y arena fina lavada para tarrajeo', NULL, 4),
('cat-5', 'Gravas', 'gravas', 'Piedra chancada 1/2", 3/4" y grava de río seleccionada', NULL, 5),
('cat-6', 'Concretos', 'concretos', 'Mezclas secas embolsadas f\'c 210 kg/cm² y morteros listos', NULL, 6);

-- 3. Subcategorías
INSERT INTO categories (id, name, slug, description, parent_id, sort_order) VALUES
('sub-1', 'Cemento Portland Tipo I', 'cemento-portland-tipo-1', 'Uso general en vigas y columnas', 'cat-1', 1),
('sub-2', 'Cemento Estructural Tipo V', 'cemento-estructural-tipo-5', 'Resistente a sulfatos y sales', 'cat-1', 2),
('sub-3', 'Ladrillo Portante King Kong', 'ladrillos-portantes', 'Muros portantes estructurales', 'cat-2', 1),
('sub-4', 'Ladrillo Pandereta', 'ladrillos-tabiqueria', 'Tabiquería divisoria liviana', 'cat-2', 2),
('sub-5', 'Fierro Corrugado Grado 60', 'fierro-corrugado-grado-60', 'Varillas de acero de 9 metros', 'cat-3', 1),
('sub-6', 'Alambre & Amarres', 'alambre-amarres', 'Alambre negro recocido #16', 'cat-3', 2),
('sub-7', 'Arena Gruesa de Río', 'arena-gruesa', 'Agregado fino para concreto', 'cat-4', 1),
('sub-8', 'Arena Fina Especial', 'arena-fina', 'Tarrajeo y revoque fino', 'cat-4', 2),
('sub-9', 'Piedra Chancada 1/2"', 'piedra-chancada-media', 'Agregado grueso para vaciados', 'cat-5', 1);

-- 4. Etiquetas
INSERT INTO tags (id, name, slug, color) VALUES
('tag-1', 'Cimentación', 'cimentacion', 'amber'),
('tag-2', 'Estructural', 'estructural', 'blue'),
('tag-3', 'Muros Portantes', 'portante', 'red'),
('tag-4', 'Acabados & Tarrajeo', 'acabados', 'emerald'),
('tag-5', 'Favorito', 'favorito', 'yellow'),
('tag-6', 'Por Cotizar', 'por-cotizar', 'indigo');

-- 5. Productos
INSERT INTO products (id, name, slug, description, category_id, subcategory_id, price, currency, unit, stock, min_stock_alert, sku, is_featured) VALUES
('prod-1', 'Cemento Portland Gris Tipo I (42.5 kg)', 'cemento-portland-gris-tipo-1', 'Cemento hidráulico para obras de concreto armado, columnas y losas.', 'cat-1', 'sub-1', 31.50, 'PEN', 'bolsa (42.5 kg)', 450, 80, 'CEM-SOL-T1-425', 1),
('prod-2', 'Ladrillo King Kong 18 Huecos Estructural', 'ladrillo-king-kong-18-huecos', 'Ladrillo de arcilla cocida para muros portantes antisísmicos.', 'cat-2', 'sub-3', 1050.00, 'PEN', 'millar (1000 unid)', 18000, 2000, 'LAD-KK18-ESTR', 1),
('prod-3', 'Varilla de Acero Corrugado 1/2" Grado 60 (9 m)', 'varilla-acero-corrugado-1-2-grado-60', 'Barra de acero de 9 metros para refuerzo estructural.', 'cat-3', 'sub-5', 46.80, 'PEN', 'varilla (9 m)', 620, 100, 'ACE-COR-050-9M', 1),
('prod-4', 'Arena Gruesa Cernida de Río Seleccionada (m³)', 'arena-gruesa-cernida-m3', 'Agregado fino limpio libre de materia orgánica para mezcla de concreto.', 'cat-4', 'sub-7', 68.00, 'PEN', 'm³ (metro cúbico)', 95, 20, 'ARE-GRU-M3-RIO', 1),
('prod-5', 'Piedra Chancada de 1/2" Grava Granulada (m³)', 'piedra-chancada-media-m3', 'Piedra triturada de cantera de 1/2 pulgada para vaciados.', 'cat-5', 'sub-9', 74.00, 'PEN', 'm³ (metro cúbico)', 80, 15, 'GRA-CHA-050-M3', 0),
('prod-6', 'Ladrillo Pandereta Acanalado para Tabiquería', 'ladrillo-pandereta-acanalado', 'Ladrillo cerámico hueco liviano para tabiques divisorios sin carga.', 'cat-2', 'sub-4', 880.00, 'PEN', 'millar (1000 unid)', 12000, 1500, 'LAD-PAN-DIV-MIL', 0),
('prod-7', 'Varilla de Acero Corrugado 3/8" Grado 60 (9 m)', 'varilla-acero-corrugado-3-8-grado-60', 'Fierro corrugado para estribos, dinteles y losas aligeradas.', 'cat-3', 'sub-5', 26.50, 'PEN', 'varilla (9 m)', 840, 120, 'ACE-COR-038-9M', 0),
('prod-8', 'Alambre Negro Recocido #16 para Amarre (Rollo 1 kg)', 'alambre-negro-recocido-16-1kg', 'Alambre recocido de máxima ductilidad para amarrar fierro.', 'cat-3', 'sub-6', 6.80, 'PEN', 'kilo (rollo 1 kg)', 350, 40, 'ALA-NEG-16-1KG', 0),
('prod-9', 'Arena Fina Lavada Especial para Tarrajeo (m³)', 'arena-fina-lavada-m3', 'Arena fina seleccionada para revoques y tarrajeos que no fisura.', 'cat-4', 'sub-8', 78.00, 'PEN', 'm³ (metro cúbico)', 45, 15, 'ARE-FIN-M3-LAV', 0),
('prod-10', 'Cemento Estructural Tipo V Resistente a Sulfatos (42.5 kg)', 'cemento-estructural-tipo-5-antisulfato', 'Especial para cimentaciones expuestas a salitre y aguas subterráneas.', 'cat-1', 'sub-2', 36.50, 'PEN', 'bolsa (42.5 kg)', 190, 50, 'CEM-ESTR-T5-425', 0);

-- 6. Atributos de Productos
INSERT INTO product_attributes (id, product_id, `key`, `value`, unit) VALUES
('pa-1', 'prod-1', 'Peso por envase', '42.5 kg', 'kg'),
('pa-2', 'prod-1', 'Norma Técnica', 'NTP 334.009 / ASTM C-150', ''),
('pa-3', 'prod-1', 'Resistencia a 28 días', '≥ 350 kg/cm²', 'kg/cm²'),
('pa-4', 'prod-2', 'Dimensiones', '24 x 13 x 9 cm', 'cm'),
('pa-5', 'prod-2', 'Peso por unidad', '2.85 kg', 'kg'),
('pa-6', 'prod-2', 'Rendimiento en muro', '38 a 40 unid/m²', 'unid/m²'),
('pa-7', 'prod-2', 'Resistencia a compresión', '140 kg/cm²', 'kg/cm²'),
('pa-8', 'prod-3', 'Diámetro nominal', '1/2 pulgada (12.7 mm)', 'pulg'),
('pa-9', 'prod-3', 'Longitud', '9.00 metros', 'm'),
('pa-10', 'prod-3', 'Límite de Fluencia (fy)', '420 MPa (4,200 kg/cm²)', 'kg/cm²'),
('pa-11', 'prod-4', 'Densidad aparente', '1,550 kg/m³', 'kg/m³'),
('pa-12', 'prod-5', 'Tamaño Máximo Nominal', '1/2 pulgada (12.5 mm)', 'pulg');
