<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class MachineryController extends BaseController
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

        if (!empty($params['category']) && $params['category'] !== 'all') {
            $conditions[] = "category = :category";
            $bindings[':category'] = $params['category'];
        }

        if (!empty($params['q'])) {
            $conditions[] = "(name LIKE :q OR brand LIKE :q OR model LIKE :q OR description LIKE :q)";
            $bindings[':q'] = '%' . $params['q'] . '%';
        }

        $sql = "SELECT * FROM machineries";
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll();

        $items = array_map([$this, 'formatMachinery'], $rows);

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($items),
            'data' => $items,
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM machineries WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $id, ':slug' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Maquinaria no encontrada', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatMachinery($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $name = trim($body['name'] ?? '');

        if (empty($name)) {
            return $this->errorResponse($response, 'El nombre de la maquinaria es obligatorio', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'mach-' . uniqid();
        $slug = !empty($body['slug']) ? trim($body['slug']) : $this->generateSlug($name);
        $category = !empty($body['category']) ? trim($body['category']) : 'pesada';
        $categoryName = !empty($body['categoryName']) ? trim($body['categoryName']) : 'Maquinaria Pesada';
        $brand = !empty($body['brand']) ? trim($body['brand']) : 'General';
        $brandId = !empty($body['brandId']) ? trim($body['brandId']) : null;
        $model = !empty($body['model']) ? trim($body['model']) : 'Estándar';
        $description = trim($body['description'] ?? '');
        $year = isset($body['year']) ? (int)$body['year'] : (int)date('Y');
        $powerHp = !empty($body['powerHp']) ? trim($body['powerHp']) : null;
        $capacity = !empty($body['capacity']) ? trim($body['capacity']) : null;
        $operatingWeight = !empty($body['operatingWeight']) ? trim($body['operatingWeight']) : null;
        $fuelType = !empty($body['fuelType']) ? trim($body['fuelType']) : 'Diésel';
        $imageUrl = !empty($body['imageUrl']) ? trim($body['imageUrl']) : null;
        $galleryImages = isset($body['galleryImages']) && is_array($body['galleryImages']) ? $body['galleryImages'] : [];
        if ($imageUrl && !in_array($imageUrl, $galleryImages)) {
            array_unshift($galleryImages, $imageUrl);
        }
        $includesOperator = isset($body['includesOperator']) ? ($body['includesOperator'] ? 1 : 0) : 1;
        $operatorDetails = !empty($body['operatorDetails']) ? trim($body['operatorDetails']) : null;
        $deliveryConditions = !empty($body['deliveryConditions']) ? trim($body['deliveryConditions']) : null;
        $minRentalHours = isset($body['minRentalHours']) ? (int)$body['minRentalHours'] : 8;
        $status = !empty($body['status']) ? trim($body['status']) : 'available';
        $featured = !empty($body['featured']) ? 1 : 0;
        $technicalSpecs = isset($body['technicalSpecs']) && is_array($body['technicalSpecs']) ? $body['technicalSpecs'] : [];
        $now = date('c');

        $stmt = $this->db->prepare("
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

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':slug' => $slug,
            ':category' => $category,
            ':category_name' => $categoryName,
            ':brand' => $brand,
            ':brand_id' => $brandId,
            ':model' => $model,
            ':description' => $description,
            ':year' => $year,
            ':power_hp' => $powerHp,
            ':capacity' => $capacity,
            ':operating_weight' => $operatingWeight,
            ':fuel_type' => $fuelType,
            ':image_url' => $imageUrl,
            ':gallery_images' => json_encode($galleryImages, JSON_UNESCAPED_SLASHES),
            ':includes_operator' => $includesOperator,
            ':operator_details' => $operatorDetails,
            ':delivery_conditions' => $deliveryConditions,
            ':min_rental_hours' => $minRentalHours,
            ':status' => $status,
            ':featured' => $featured,
            ':technical_specs' => json_encode($technicalSpecs, JSON_UNESCAPED_SLASHES),
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM machineries WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Maquinaria no encontrada', 404);
        }

        $body = (array)$request->getParsedBody();
        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $slug = isset($body['slug']) ? trim($body['slug']) : $existing['slug'];
        $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
        $categoryName = isset($body['categoryName']) ? trim($body['categoryName']) : $existing['category_name'];
        $brand = isset($body['brand']) ? trim($body['brand']) : $existing['brand'];
        $brandId = array_key_exists('brandId', $body) ? trim((string)$body['brandId']) : $existing['brand_id'];
        $model = isset($body['model']) ? trim($body['model']) : $existing['model'];
        $description = isset($body['description']) ? trim($body['description']) : $existing['description'];
        $year = isset($body['year']) ? (int)$body['year'] : (int)$existing['year'];
        $powerHp = array_key_exists('powerHp', $body) ? trim((string)$body['powerHp']) : $existing['power_hp'];
        $capacity = array_key_exists('capacity', $body) ? trim((string)$body['capacity']) : $existing['capacity'];
        $operatingWeight = array_key_exists('operatingWeight', $body) ? trim((string)$body['operatingWeight']) : $existing['operating_weight'];
        $fuelType = isset($body['fuelType']) ? trim($body['fuelType']) : $existing['fuel_type'];
        $imageUrl = array_key_exists('imageUrl', $body) ? trim((string)$body['imageUrl']) : $existing['image_url'];
        
        $galleryImages = isset($body['galleryImages']) && is_array($body['galleryImages']) 
            ? $body['galleryImages'] 
            : json_decode($existing['gallery_images'] ?? '[]', true) ?: [];

        $includesOperator = isset($body['includesOperator']) ? ($body['includesOperator'] ? 1 : 0) : (int)$existing['includes_operator'];
        $operatorDetails = array_key_exists('operatorDetails', $body) ? trim((string)$body['operatorDetails']) : $existing['operator_details'];
        $deliveryConditions = array_key_exists('deliveryConditions', $body) ? trim((string)$body['deliveryConditions']) : $existing['delivery_conditions'];
        $minRentalHours = isset($body['minRentalHours']) ? (int)$body['minRentalHours'] : (int)$existing['min_rental_hours'];
        $status = isset($body['status']) ? trim($body['status']) : $existing['status'];
        $featured = isset($body['featured']) ? ($body['featured'] ? 1 : 0) : (int)$existing['featured'];
        
        $technicalSpecs = isset($body['technicalSpecs']) && is_array($body['technicalSpecs'])
            ? $body['technicalSpecs']
            : json_decode($existing['technical_specs'] ?? '[]', true) ?: [];

        $now = date('c');

        $updateStmt = $this->db->prepare("
            UPDATE machineries SET
                name = :name,
                slug = :slug,
                category = :category,
                category_name = :category_name,
                brand = :brand,
                brand_id = :brand_id,
                model = :model,
                description = :description,
                year = :year,
                power_hp = :power_hp,
                capacity = :capacity,
                operating_weight = :operating_weight,
                fuel_type = :fuel_type,
                image_url = :image_url,
                gallery_images = :gallery_images,
                includes_operator = :includes_operator,
                operator_details = :operator_details,
                delivery_conditions = :delivery_conditions,
                min_rental_hours = :min_rental_hours,
                status = :status,
                featured = :featured,
                technical_specs = :technical_specs,
                updated_at = :updated_at
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':slug' => $slug,
            ':category' => $category,
            ':category_name' => $categoryName,
            ':brand' => $brand,
            ':brand_id' => $brandId ?: null,
            ':model' => $model,
            ':description' => $description,
            ':year' => $year,
            ':power_hp' => $powerHp ?: null,
            ':capacity' => $capacity ?: null,
            ':operating_weight' => $operatingWeight ?: null,
            ':fuel_type' => $fuelType,
            ':image_url' => $imageUrl ?: null,
            ':gallery_images' => json_encode($galleryImages, JSON_UNESCAPED_SLASHES),
            ':includes_operator' => $includesOperator,
            ':operator_details' => $operatorDetails ?: null,
            ':delivery_conditions' => $deliveryConditions ?: null,
            ':min_rental_hours' => $minRentalHours,
            ':status' => $status,
            ':featured' => $featured,
            ':technical_specs' => json_encode($technicalSpecs, JSON_UNESCAPED_SLASHES),
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("DELETE FROM machineries WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Maquinaria eliminada del sistema',
            'deletedId' => $id,
        ]);
    }

    private function formatMachinery(array $row): array
    {
        $galleryImages = json_decode($row['gallery_images'] ?? '[]', true) ?: [];
        $imageUrl = $row['image_url'] ?? '';
        if ($imageUrl && !in_array($imageUrl, $galleryImages)) {
            array_unshift($galleryImages, $imageUrl);
        }

        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'] ?? $this->generateSlug($row['name']),
            'category' => $row['category'],
            'categoryName' => $row['category_name'] ?? 'Maquinaria Pesada',
            'brand' => $row['brand'],
            'brandId' => $row['brand_id'] ?? null,
            'model' => $row['model'] ?? 'Estándar',
            'description' => $row['description'] ?? '',
            'year' => (int)($row['year'] ?? 2022),
            'powerHp' => $row['power_hp'] ?? null,
            'capacity' => $row['capacity'] ?? null,
            'operatingWeight' => $row['operating_weight'] ?? null,
            'fuelType' => $row['fuel_type'] ?? 'Diésel',
            'imageUrl' => $imageUrl,
            'galleryImages' => $galleryImages,
            'hourlyRate' => null,
            'dailyRate' => null,
            'monthlyRate' => null,
            'currency' => 'PEN',
            'minRentalHours' => (int)($row['min_rental_hours'] ?? 8),
            'includesOperator' => !empty($row['includes_operator']),
            'operatorDetails' => $row['operator_details'] ?? null,
            'deliveryConditions' => $row['delivery_conditions'] ?? null,
            'status' => $row['status'] ?? 'available',
            'featured' => !empty($row['featured']),
            'technicalSpecs' => json_decode($row['technical_specs'] ?? '[]', true) ?: [],
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    private function generateSlug(string $name): string
    {
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        $slug = preg_replace('/[^a-zA-Z0-9 -]/', '', $slug);
        $slug = strtolower(trim(substr($slug, 0, 80)));
        return preg_replace('/[ -]+/', '-', $slug);
    }
}
