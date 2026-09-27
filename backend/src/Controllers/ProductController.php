<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ProductController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $conditions = [];
        $bindings = [];

        if (!empty($params['category'])) {
            $conditions[] = "(category_id = :category OR subcategory_id = :category)";
            $bindings[':category'] = $params['category'];
        }

        if (!empty($params['brand'])) {
            $conditions[] = "brand_id = :brand";
            $bindings[':brand'] = $params['brand'];
        }

        if (!empty($params['q'])) {
            $conditions[] = "(name LIKE :q OR description LIKE :q OR sku LIKE :q)";
            $bindings[':q'] = '%' . $params['q'] . '%';
        }

        if (isset($params['featured'])) {
            $conditions[] = "featured = :featured";
            $bindings[':featured'] = $params['featured'] === 'true' || $params['featured'] === '1' ? 1 : 0;
        }

        $sql = "SELECT * FROM products";
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll();

        $products = array_map([$this, 'formatProduct'], $rows);

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($products),
            'data' => $products,
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM products WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $id, ':slug' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Material / Producto no encontrado', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatProduct($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();

        $name = trim($body['name'] ?? '');
        $categoryId = trim($body['categoryId'] ?? '');

        if (empty($name)) {
            return $this->errorResponse($response, 'El nombre del material es obligatorio', 422);
        }
        if (empty($categoryId)) {
            return $this->errorResponse($response, 'La categoría del material es obligatoria', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'prod-' . uniqid();
        $slug = !empty($body['slug']) ? trim($body['slug']) : $this->generateSlug($name);
        $description = trim($body['description'] ?? '');
        $subcategoryId = !empty($body['subcategoryId']) ? trim($body['subcategoryId']) : null;
        $brandId = !empty($body['brandId']) ? trim($body['brandId']) : null;
        $brandName = !empty($body['brandName']) ? trim($body['brandName']) : null;
        $presentation = !empty($body['presentation']) ? trim($body['presentation']) : null;

        $price = isset($body['price']) && $body['price'] !== null && $body['price'] !== '' ? (float)$body['price'] : null;
        $currency = in_array($body['currency'] ?? '', ['USD', 'PEN'], true) ? $body['currency'] : 'PEN';
        $unit = trim($body['unit'] ?? 'unidad');
        $sku = !empty($body['sku']) ? trim($body['sku']) : null;
        $featured = !empty($body['featured']) ? 1 : 0;

        $attributes = json_encode(!empty($body['attributes']) && is_array($body['attributes']) ? $body['attributes'] : []);
        $media = json_encode(!empty($body['media']) && is_array($body['media']) ? $body['media'] : []);
        $tags = json_encode(!empty($body['tags']) && is_array($body['tags']) ? $body['tags'] : []);

        $now = date('c');

        $stmt = $this->db->prepare("
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

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':slug' => $slug,
            ':description' => $description,
            ':category_id' => $categoryId,
            ':subcategory_id' => $subcategoryId,
            ':brand_id' => $brandId,
            ':brand_name' => $brandName,
            ':presentation' => $presentation,
            ':price' => $price,
            ':currency' => $currency,
            ':unit' => $unit,
            ':sku' => $sku,
            ':featured' => $featured,
            ':attributes' => $attributes,
            ':media' => $media,
            ':tags' => $tags,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM products WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Material / Producto no encontrado', 404);
        }

        $body = (array)$request->getParsedBody();

        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $slug = isset($body['slug']) ? trim($body['slug']) : $existing['slug'];
        $description = isset($body['description']) ? trim($body['description']) : $existing['description'];
        $categoryId = isset($body['categoryId']) ? trim($body['categoryId']) : $existing['category_id'];
        $subcategoryId = array_key_exists('subcategoryId', $body) ? (!empty($body['subcategoryId']) ? trim($body['subcategoryId']) : null) : $existing['subcategory_id'];
        $brandId = array_key_exists('brandId', $body) ? (!empty($body['brandId']) ? trim($body['brandId']) : null) : $existing['brand_id'];
        $brandName = array_key_exists('brandName', $body) ? (!empty($body['brandName']) ? trim($body['brandName']) : null) : $existing['brand_name'];
        $presentation = array_key_exists('presentation', $body) ? (!empty($body['presentation']) ? trim($body['presentation']) : null) : $existing['presentation'];

        $price = $existing['price'];
        if (array_key_exists('price', $body)) {
            $price = ($body['price'] !== null && $body['price'] !== '') ? (float)$body['price'] : null;
        }

        $currency = isset($body['currency']) && in_array($body['currency'], ['USD', 'PEN'], true) ? $body['currency'] : $existing['currency'];
        $unit = isset($body['unit']) ? trim($body['unit']) : $existing['unit'];
        $sku = array_key_exists('sku', $body) ? (!empty($body['sku']) ? trim($body['sku']) : null) : $existing['sku'];
        $featured = isset($body['featured']) ? (!empty($body['featured']) ? 1 : 0) : (int)$existing['featured'];

        $attributes = $existing['attributes'];
        if (isset($body['attributes']) && is_array($body['attributes'])) {
            $attributes = json_encode($body['attributes']);
        }

        $media = $existing['media'];
        if (isset($body['media']) && is_array($body['media'])) {
            $media = json_encode($body['media']);
        }

        $tags = $existing['tags'];
        if (isset($body['tags']) && is_array($body['tags'])) {
            $tags = json_encode($body['tags']);
        }

        $now = date('c');

        $updateStmt = $this->db->prepare("
            UPDATE products SET
                name = :name,
                slug = :slug,
                description = :description,
                category_id = :category_id,
                subcategory_id = :subcategory_id,
                brand_id = :brand_id,
                brand_name = :brand_name,
                presentation = :presentation,
                price = :price,
                currency = :currency,
                unit = :unit,
                sku = :sku,
                featured = :featured,
                attributes = :attributes,
                media = :media,
                tags = :tags,
                updated_at = :updated_at
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':slug' => $slug,
            ':description' => $description,
            ':category_id' => $categoryId,
            ':subcategory_id' => $subcategoryId,
            ':brand_id' => $brandId,
            ':brand_name' => $brandName,
            ':presentation' => $presentation,
            ':price' => $price,
            ':currency' => $currency,
            ':unit' => $unit,
            ':sku' => $sku,
            ':featured' => $featured,
            ':attributes' => $attributes,
            ':media' => $media,
            ':tags' => $tags,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("DELETE FROM products WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Material eliminado exitosamente',
            'deletedId' => $id,
        ]);
    }

    private function formatProduct(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'] ?? '',
            'categoryId' => $row['category_id'],
            'subcategoryId' => $row['subcategory_id'] ?? null,
            'brandId' => $row['brand_id'] ?? null,
            'brandName' => $row['brand_name'] ?? null,
            'presentation' => $row['presentation'] ?? null,
            'price' => $row['price'] !== null ? (float)$row['price'] : null,
            'currency' => $row['currency'] ?? 'PEN',
            'unit' => $row['unit'] ?? 'unidad',
            'sku' => $row['sku'] ?? null,
            'featured' => (bool)$row['featured'],
            'attributes' => !empty($row['attributes']) ? json_decode($row['attributes'], true) : [],
            'media' => !empty($row['media']) ? json_decode($row['media'], true) : [],
            'tags' => !empty($row['tags']) ? json_decode($row['tags'], true) : [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    private function generateSlug(string $name): string
    {
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        $slug = preg_replace('/[^a-zA-Z0-9 -]/', '', $slug);
        $slug = strtolower(trim(substr($slug, 0, 100)));
        $slug = preg_replace('/[ -]+/', '-', $slug);
        return $slug ?: 'prod-' . uniqid();
    }
}
