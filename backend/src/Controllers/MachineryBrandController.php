<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class MachineryBrandController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM machinery_brands ORDER BY name ASC");
        $rows = $stmt->fetchAll();

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($rows),
            'data' => array_map([$this, 'formatBrand'], $rows),
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM machinery_brands WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $id, ':slug' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Marca de maquinaria no encontrada', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatBrand($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $name = trim($body['name'] ?? '');

        if (empty($name)) {
            return $this->errorResponse($response, 'El nombre de la marca de maquinaria es obligatorio', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'mbr-' . uniqid();
        $slug = !empty($body['slug']) ? trim($body['slug']) : $this->generateSlug($name);
        $category = !empty($body['category']) ? trim($body['category']) : 'pesada';
        $description = trim($body['description'] ?? '');
        $logoUrl = !empty($body['logoUrl']) ? trim($body['logoUrl']) : null;
        $now = date('c');

        $stmt = $this->db->prepare("
            INSERT INTO machinery_brands (id, name, slug, category, description, logo_url, created_at)
            VALUES (:id, :name, :slug, :category, :description, :logo_url, :created_at)
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':slug' => $slug,
            ':category' => $category,
            ':description' => $description,
            ':logo_url' => $logoUrl,
            ':created_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM machinery_brands WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Marca de maquinaria no encontrada', 404);
        }

        $body = (array)$request->getParsedBody();
        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $slug = isset($body['slug']) ? trim($body['slug']) : $existing['slug'];
        $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
        $description = isset($body['description']) ? trim($body['description']) : $existing['description'];
        $logoUrl = array_key_exists('logoUrl', $body) ? trim((string)$body['logoUrl']) : $existing['logo_url'];

        $updateStmt = $this->db->prepare("
            UPDATE machinery_brands SET
                name = :name,
                slug = :slug,
                category = :category,
                description = :description,
                logo_url = :logo_url
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':slug' => $slug,
            ':category' => $category,
            ':description' => $description,
            ':logo_url' => $logoUrl ?: null,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';

        $stmt = $this->db->prepare("DELETE FROM machinery_brands WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Marca de maquinaria eliminada exitosamente',
            'deletedId' => $id,
        ]);
    }

    private function formatBrand(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'category' => $row['category'] ?? 'pesada',
            'description' => $row['description'] ?? '',
            'logoUrl' => $row['logo_url'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
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
