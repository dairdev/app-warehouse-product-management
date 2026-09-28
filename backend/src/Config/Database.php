<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function getDatabaseFile(): string
    {
        $envPath = getenv('DB_PATH');
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
            $dbHost = getenv('DB_HOST');
            $dbName = getenv('DB_NAME');
            $dbUser = getenv('DB_USER');
            $dbPass = getenv('DB_PASSWORD');

            if ($dbHost && $dbName) {
                // MySQL connection
                $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
                self::$instance = new PDO($dsn, $dbUser ?: 'root', $dbPass ?: '', [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
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
        // 1. Settings Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS store_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL
            );
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
            );
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
            );
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
            );
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
            );
        ");

        // 6. Tags Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS tags (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                color VARCHAR(50) DEFAULT 'yellow'
            );
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
            $stmt = $pdo->prepare("INSERT OR REPLACE INTO store_settings (key, value) VALUES (:key, :value)");
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
    }
}
