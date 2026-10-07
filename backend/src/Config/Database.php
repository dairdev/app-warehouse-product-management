<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;
    private static bool $envLoaded = false;

    /**
     * Loads variables from .env file into putenv, $_ENV, and $_SERVER
     */
    public static function loadEnv(): void
    {
        if (self::$envLoaded) {
            return;
        }
        self::$envLoaded = true;

        $envFiles = [
            __DIR__ . '/../../.env',
            __DIR__ . '/../.env',
            dirname(__DIR__, 2) . '/.env',
            dirname(__DIR__) . '/.env',
            __DIR__ . '/.env',
        ];

        foreach ($envFiles as $file) {
            if (file_exists($file) && is_readable($file)) {
                $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                if ($lines !== false) {
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if ($line === '' || str_starts_with($line, '#')) {
                            continue;
                        }
                        if (str_contains($line, '=')) {
                            [$key, $val] = explode('=', $line, 2);
                            $key = trim($key);
                            $val = trim($val);
                            if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                                (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                                $val = substr($val, 1, -1);
                            }
                            if (!isset($_SERVER[$key]) && !isset($_ENV[$key])) {
                                putenv("{$key}={$val}");
                                $_ENV[$key] = $val;
                                $_SERVER[$key] = $val;
                            }
                        }
                    }
                }
                break;
            }
        }
    }

    /**
     * Safely get environment variable with fallback default
     */
    public static function getEnvVar(string $name, mixed $default = null): mixed
    {
        self::loadEnv();
        if (isset($_ENV[$name]) && $_ENV[$name] !== '') {
            return $_ENV[$name];
        }
        if (isset($_SERVER[$name]) && $_SERVER[$name] !== '') {
            return $_SERVER[$name];
        }
        $val = getenv($name);
        return ($val !== false && $val !== '') ? $val : $default;
    }

    public static function getDatabaseFile(): string
    {
        $envPath = self::getEnvVar('DB_PATH');
        if ($envPath) {
            return $envPath;
        }

        $candidates = [
            __DIR__ . '/../../data/ferreteria.sqlite',
            __DIR__ . '/../data/ferreteria.sqlite',
            dirname(__DIR__, 2) . '/data/ferreteria.sqlite',
            dirname(__DIR__) . '/data/ferreteria.sqlite',
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate) || is_dir(dirname($candidate))) {
                return $candidate;
            }
        }

        return __DIR__ . '/../../data/ferreteria.sqlite';
    }

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            self::loadEnv();

            $dbConnection = strtolower((string)self::getEnvVar('DB_CONNECTION', ''));
            $dbHost = self::getEnvVar('DB_HOST');
            $dbPort = self::getEnvVar('DB_PORT', '3306');
            $dbName = self::getEnvVar('DB_NAME');
            $dbUser = self::getEnvVar('DB_USER');
            $dbPass = self::getEnvVar('DB_PASSWORD', '');
            $dbCharset = self::getEnvVar('DB_CHARSET', 'utf8mb4');

            // Determine if MySQL should be used
            $useMySql = ($dbConnection === 'mysql') || (!empty($dbHost) && !empty($dbName) && $dbConnection !== 'sqlite');

            if ($useMySql) {
                // MySQL / MariaDB connection
                $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset={$dbCharset}";
                self::$instance = new PDO($dsn, $dbUser ?: 'root', $dbPass ?: '', [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$dbCharset} COLLATE utf8mb4_unicode_ci",
                ]);
            } else {
                // SQLite connection
                $dbFile = self::getDatabaseFile();
                $dbDir = dirname($dbFile);
                if (!is_dir($dbDir)) {
                    mkdir($dbDir, 0777, true);
                }
                $dsn = "sqlite:" . $dbFile;
                self::$instance = new PDO($dsn, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
                self::$instance->exec("PRAGMA foreign_keys = ON;");
            }

            self::initializeTables(self::$instance);
        }

        return self::$instance;
    }

    private static function initializeTables(PDO $pdo): void
    {
        $isMySql = ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql');
        $tableOpts = $isMySql ? " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci" : "";

        // 1. Settings Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS store_settings (
                `key` VARCHAR(100) PRIMARY KEY,
                `value` TEXT NOT NULL
            ){$tableOpts};
        ");

        // 2. Categories Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                slug VARCHAR(180) NOT NULL,
                description TEXT,
                parent_id VARCHAR(100) NULL,
                icon_name VARCHAR(50) DEFAULT 'Package',
                sort_order INTEGER DEFAULT 0,
                default_presentations TEXT,
                created_at TEXT,
                updated_at TEXT
            ){$tableOpts};
        ");

        // 3. Brands Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS brands (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                slug VARCHAR(180) NOT NULL,
                description TEXT,
                origin VARCHAR(100) DEFAULT 'Perú',
                logo_url TEXT,
                created_at TEXT
            ){$tableOpts};
        ");

        // 4. Products Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                description TEXT,
                category_id VARCHAR(100) NOT NULL,
                subcategory_id VARCHAR(100) NULL,
                brand_id VARCHAR(100) NULL,
                brand_name VARCHAR(150) NULL,
                presentation VARCHAR(100) NULL,
                price REAL NULL,
                currency VARCHAR(10) DEFAULT 'PEN',
                unit VARCHAR(50) DEFAULT 'unidad',
                sku VARCHAR(100) NULL,
                featured INTEGER DEFAULT 0,
                attributes TEXT,
                media TEXT,
                tags TEXT,
                created_at TEXT,
                updated_at TEXT
            ){$tableOpts};
        ");

        // 5. Users Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(191) NOT NULL UNIQUE,
                role VARCHAR(20) DEFAULT 'client',
                phone VARCHAR(50) NULL,
                company VARCHAR(150) NULL,
                password_hash VARCHAR(255) NULL,
                created_at TEXT,
                updated_at TEXT
            ){$tableOpts};
        ");

        // 6. Tags Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS tags (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                color VARCHAR(50) DEFAULT 'yellow'
            ){$tableOpts};
        ");

        // 7. Clients Table (Gestión Comercial de Clientes)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS clients (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(191) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                company VARCHAR(150) NULL,
                document_type VARCHAR(20) DEFAULT 'RUC',
                document_number VARCHAR(30) NULL,
                address TEXT,
                notes TEXT,
                user_id VARCHAR(100) NULL,
                created_at TEXT,
                updated_at TEXT
            ){$tableOpts};
        ");

        // 8. Machinery Brands Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS machinery_brands (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                slug VARCHAR(180) NOT NULL,
                category VARCHAR(50) DEFAULT 'pesada',
                description TEXT,
                logo_url TEXT,
                created_at TEXT
            ){$tableOpts};
        ");

        // 9. Machineries Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS machineries (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                category_name VARCHAR(100) NOT NULL,
                brand VARCHAR(150) NOT NULL,
                brand_id VARCHAR(100) NULL,
                model VARCHAR(100) NOT NULL,
                description TEXT,
                year INTEGER NOT NULL,
                power_hp VARCHAR(50) NULL,
                capacity VARCHAR(100) NULL,
                operating_weight VARCHAR(50) NULL,
                fuel_type VARCHAR(50) DEFAULT 'Diésel',
                image_url TEXT,
                gallery_images TEXT,
                includes_operator INTEGER DEFAULT 1,
                operator_details TEXT,
                delivery_conditions TEXT,
                min_rental_hours INTEGER DEFAULT 8,
                status VARCHAR(30) DEFAULT 'available',
                featured INTEGER DEFAULT 1,
                technical_specs TEXT,
                created_at TEXT,
                updated_at TEXT
            ){$tableOpts};
        ");

        // 10. Machinery Rental Requests Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS machinery_rental_requests (
                id VARCHAR(100) PRIMARY KEY,
                machinery_id VARCHAR(100) NOT NULL,
                machinery_name VARCHAR(255) NOT NULL,
                machinery_brand VARCHAR(150) NULL,
                machinery_model VARCHAR(100) NULL,
                machinery_image_url TEXT,
                client_id VARCHAR(100) NULL,
                client_name VARCHAR(150) NOT NULL,
                client_email VARCHAR(191) NOT NULL,
                client_phone VARCHAR(50) NOT NULL,
                obra_location VARCHAR(255) NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                start_hour VARCHAR(20) DEFAULT '08:00',
                end_hour VARCHAR(20) DEFAULT '17:00',
                total_hours_or_days VARCHAR(100) NULL,
                needs_operator INTEGER DEFAULT 1,
                notes TEXT,
                created_by VARCHAR(20) DEFAULT 'client',
                status VARCHAR(30) DEFAULT 'pending',
                approved_by VARCHAR(150) NULL,
                approved_at TEXT,
                created_at TEXT,
                updated_at TEXT
            ){$tableOpts};
        ");

        // Check if data is already seeded
        $checkStmt = $pdo->query("SELECT COUNT(*) FROM categories");
        $count = (int)$checkStmt->fetchColumn();

        if ($count === 0) {
            self::seedInitialData($pdo);
        }
    }

    private static function seedInitialData(PDO $pdo): void
    {
        $jsonFile = __DIR__ . '/../../data/initialData.json';
        if (!file_exists($jsonFile)) {
            return;
        }

        $data = json_decode(file_get_contents($jsonFile), true);
        if (!$data) {
            return;
        }

        // Seed Store Settings
        if (!empty($data['settings'])) {
            $stmt = $pdo->prepare("REPLACE INTO store_settings (`key`, `value`) VALUES (:key, :value)");
            foreach ($data['settings'] as $k => $v) {
                $stmt->execute([
                    ':key' => $k,
                    ':value' => (string)$v,
                ]);
            }
        }

        // Seed Categories
        if (!empty($data['categories'])) {
            $stmt = $pdo->prepare("
                INSERT INTO categories (id, name, slug, description, parent_id, icon_name, sort_order, default_presentations, created_at, updated_at)
                VALUES (:id, :name, :slug, :description, :parent_id, :icon_name, :sort_order, :default_presentations, :created_at, :updated_at)
            ");
            $now = date('c');
            foreach ($data['categories'] as $cat) {
                $stmt->execute([
                    ':id' => $cat['id'],
                    ':name' => $cat['name'],
                    ':slug' => $cat['slug'] ?? strtolower(str_replace(' ', '-', $cat['name'])),
                    ':description' => $cat['description'] ?? '',
                    ':parent_id' => $cat['parentId'] ?? null,
                    ':icon_name' => $cat['iconName'] ?? 'Package',
                    ':sort_order' => $cat['sortOrder'] ?? 0,
                    ':default_presentations' => isset($cat['defaultPresentations']) ? json_encode($cat['defaultPresentations']) : null,
                    ':created_at' => $now,
                    ':updated_at' => $now,
                ]);
            }
        }

        // Seed Brands
        if (!empty($data['brands'])) {
            $stmt = $pdo->prepare("
                INSERT INTO brands (id, name, slug, description, origin, logo_url, created_at)
                VALUES (:id, :name, :slug, :description, :origin, :logo_url, :created_at)
            ");
            $now = date('c');
            foreach ($data['brands'] as $b) {
                $stmt->execute([
                    ':id' => $b['id'],
                    ':name' => $b['name'],
                    ':slug' => $b['slug'],
                    ':description' => $b['description'] ?? '',
                    ':origin' => $b['origin'] ?? 'Perú',
                    ':logo_url' => $b['logoUrl'] ?? null,
                    ':created_at' => $now,
                ]);
            }
        }

        // Seed Tags
        if (!empty($data['tags'])) {
            $stmt = $pdo->prepare("INSERT INTO tags (id, name, slug, color) VALUES (:id, :name, :slug, :color)");
            foreach ($data['tags'] as $t) {
                $stmt->execute([
                    ':id' => $t['id'],
                    ':name' => $t['name'],
                    ':slug' => $t['slug'],
                    ':color' => $t['color'] ?? 'yellow',
                ]);
            }
        }

        // Seed Users
        if (!empty($data['users'])) {
            $stmt = $pdo->prepare("
                INSERT INTO users (id, name, email, role, phone, company, password_hash, created_at, updated_at)
                VALUES (:id, :name, :email, :role, :phone, :company, :password_hash, :created_at, :updated_at)
            ");
            foreach ($data['users'] as $u) {
                $stmt->execute([
                    ':id' => $u['id'],
                    ':name' => $u['name'],
                    ':email' => $u['email'],
                    ':role' => $u['role'] ?? 'client',
                    ':phone' => $u['phone'] ?? null,
                    ':company' => $u['company'] ?? null,
                    ':password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                    ':created_at' => $u['createdAt'] ?? date('c'),
                    ':updated_at' => $u['updatedAt'] ?? date('c'),
                ]);
            }
        }

        // Seed Products
        if (!empty($data['products'])) {
            $stmt = $pdo->prepare("
                INSERT INTO products (
                    id, name, slug, description, category_id, subcategory_id,
                    brand_id, brand_name, presentation, price, currency,
                    unit, sku, featured, attributes, media, tags, created_at, updated_at
                ) VALUES (
                    :id, :name, :slug, :description, :category_id, :subcategory_id,
                    :brand_id, :brand_name, :presentation, :price, :currency,
                    :unit, :sku, :featured, :attributes, :media, :tags, :created_at, :updated_at
                )
            ");
            foreach ($data['products'] as $p) {
                $stmt->execute([
                    ':id' => $p['id'],
                    ':name' => $p['name'],
                    ':slug' => $p['slug'],
                    ':description' => $p['description'] ?? '',
                    ':category_id' => $p['categoryId'],
                    ':subcategory_id' => $p['subcategoryId'] ?? null,
                    ':brand_id' => $p['brandId'] ?? null,
                    ':brand_name' => $p['brandName'] ?? null,
                    ':presentation' => $p['presentation'] ?? null,
                    ':price' => isset($p['price']) && $p['price'] !== null ? (float)$p['price'] : null,
                    ':currency' => $p['currency'] ?? 'PEN',
                    ':unit' => $p['unit'] ?? 'unidad',
                    ':sku' => $p['sku'] ?? null,
                    ':featured' => !empty($p['featured']) ? 1 : 0,
                    ':attributes' => json_encode($p['attributes'] ?? []),
                    ':media' => json_encode($p['media'] ?? []),
                    ':tags' => json_encode($p['tags'] ?? []),
                    ':created_at' => $p['createdAt'] ?? date('c'),
                    ':updated_at' => $p['updatedAt'] ?? date('c'),
                ]);
            }
        }
        // Seed Clients
        if (!empty($data['clients'])) {
            $stmt = $pdo->prepare("
                INSERT INTO clients (id, name, email, phone, company, document_type, document_number, address, notes, user_id, created_at, updated_at)
                VALUES (:id, :name, :email, :phone, :company, :document_type, :document_number, :address, :notes, :user_id, :created_at, :updated_at)
            ");
            foreach ($data['clients'] as $c) {
                $stmt->execute([
                    ':id' => $c['id'],
                    ':name' => $c['name'],
                    ':email' => $c['email'],
                    ':phone' => $c['phone'],
                    ':company' => $c['company'] ?? null,
                    ':document_type' => $c['documentType'] ?? 'RUC',
                    ':document_number' => $c['documentNumber'] ?? null,
                    ':address' => $c['address'] ?? null,
                    ':notes' => $c['notes'] ?? null,
                    ':user_id' => $c['userId'] ?? null,
                    ':created_at' => $c['createdAt'] ?? date('c'),
                    ':updated_at' => $c['updatedAt'] ?? date('c'),
                ]);
            }
        }

        // Seed Machinery Brands
        if (!empty($data['machineryBrands'])) {
            $stmt = $pdo->prepare("
                INSERT INTO machinery_brands (id, name, slug, category, description, logo_url, created_at)
                VALUES (:id, :name, :slug, :category, :description, :logo_url, :created_at)
            ");
            foreach ($data['machineryBrands'] as $mb) {
                $stmt->execute([
                    ':id' => $mb['id'],
                    ':name' => $mb['name'],
                    ':slug' => $mb['slug'],
                    ':category' => $mb['category'] ?? 'pesada',
                    ':description' => $mb['description'] ?? '',
                    ':logo_url' => $mb['logoUrl'] ?? null,
                    ':created_at' => $mb['createdAt'] ?? date('c'),
                ]);
            }
        }

        // Seed Machineries
        if (!empty($data['machinery'])) {
            $stmt = $pdo->prepare("
                INSERT INTO machineries (
                    id, name, slug, category, category_name, brand, brand_id, model, description,
                    year, power_hp, capacity, operating_weight, fuel_type, image_url, gallery_images,
                    includes_operator, operator_details, delivery_conditions, min_rental_hours,
                    status, featured, technical_specs, created_at, updated_at
                ) VALUES (
                    :id, :name, :slug, :category, :category_name, :brand, :brand_id, :model, :description,
                    :year, :power_hp, :capacity, :operating_weight, :fuel_type, :image_url, :gallery_images,
                    :includes_operator, :operator_details, :delivery_conditions, :min_rental_hours,
                    :status, :featured, :technical_specs, :created_at, :updated_at
                )
            ");
            foreach ($data['machinery'] as $m) {
                $gallery = $m['galleryImages'] ?? [];
                if (!empty($m['imageUrl']) && !in_array($m['imageUrl'], $gallery)) {
                    array_unshift($gallery, $m['imageUrl']);
                }
                $stmt->execute([
                    ':id' => $m['id'],
                    ':name' => $m['name'],
                    ':slug' => $m['slug'] ?? strtolower(str_replace(' ', '-', $m['name'])),
                    ':category' => $m['category'],
                    ':category_name' => $m['categoryName'] ?? 'Maquinaria Pesada',
                    ':brand' => $m['brand'],
                    ':brand_id' => $m['brandId'] ?? null,
                    ':model' => $m['model'] ?? 'Estándar',
                    ':description' => $m['description'] ?? '',
                    ':year' => (int)($m['year'] ?? 2022),
                    ':power_hp' => $m['powerHp'] ?? null,
                    ':capacity' => $m['capacity'] ?? null,
                    ':operating_weight' => $m['operatingWeight'] ?? null,
                    ':fuel_type' => $m['fuelType'] ?? 'Diésel',
                    ':image_url' => $m['imageUrl'] ?? null,
                    ':gallery_images' => json_encode($gallery, JSON_UNESCAPED_SLASHES),
                    ':includes_operator' => !empty($m['includesOperator']) ? 1 : 0,
                    ':operator_details' => $m['operatorDetails'] ?? null,
                    ':delivery_conditions' => $m['deliveryConditions'] ?? null,
                    ':min_rental_hours' => (int)($m['minRentalHours'] ?? 8),
                    ':status' => $m['status'] ?? 'available',
                    ':featured' => !empty($m['featured']) ? 1 : 0,
                    ':technical_specs' => json_encode($m['technicalSpecs'] ?? [], JSON_UNESCAPED_SLASHES),
                    ':created_at' => $m['createdAt'] ?? date('c'),
                    ':updated_at' => $m['updatedAt'] ?? date('c'),
                ]);
            }
        }

        // Seed Rental Requests
        if (!empty($data['rentalRequests'])) {
            $stmt = $pdo->prepare("
                INSERT INTO machinery_rental_requests (
                    id, machinery_id, machinery_name, machinery_brand, machinery_model, machinery_image_url,
                    client_id, client_name, client_email, client_phone, obra_location,
                    start_date, end_date, start_hour, end_hour, total_hours_or_days,
                    needs_operator, notes, created_by, status, approved_by, approved_at,
                    created_at, updated_at
                ) VALUES (
                    :id, :machinery_id, :machinery_name, :machinery_brand, :machinery_model, :machinery_image_url,
                    :client_id, :client_name, :client_email, :client_phone, :obra_location,
                    :start_date, :end_date, :start_hour, :end_hour, :total_hours_or_days,
                    :needs_operator, :notes, :created_by, :status, :approved_by, :approved_at,
                    :created_at, :updated_at
                )
            ");
            foreach ($data['rentalRequests'] as $rr) {
                $stmt->execute([
                    ':id' => $rr['id'],
                    ':machinery_id' => $rr['machineryId'],
                    ':machinery_name' => $rr['machineryName'],
                    ':machinery_brand' => $rr['machineryBrand'] ?? null,
                    ':machinery_model' => $rr['machineryModel'] ?? null,
                    ':machinery_image_url' => $rr['machineryImageUrl'] ?? null,
                    ':client_id' => $rr['clientId'] ?? null,
                    ':client_name' => $rr['clientName'],
                    ':client_email' => $rr['clientEmail'],
                    ':client_phone' => $rr['clientPhone'],
                    ':obra_location' => $rr['obraLocation'],
                    ':start_date' => $rr['startDate'],
                    ':end_date' => $rr['endDate'],
                    ':start_hour' => $rr['startHour'] ?? '08:00',
                    ':end_hour' => $rr['endHour'] ?? '17:00',
                    ':total_hours_or_days' => $rr['totalHoursOrDays'] ?? null,
                    ':needs_operator' => !empty($rr['needsOperator']) ? 1 : 0,
                    ':notes' => $rr['notes'] ?? null,
                    ':created_by' => $rr['createdBy'] ?? 'client',
                    ':status' => $rr['status'] ?? 'pending',
                    ':approved_by' => $rr['approvedBy'] ?? null,
                    ':approved_at' => $rr['approvedAt'] ?? null,
                    ':created_at' => $rr['createdAt'] ?? date('c'),
                    ':updated_at' => $rr['updatedAt'] ?? date('c'),
                ]);
            }
        }
    }
}
