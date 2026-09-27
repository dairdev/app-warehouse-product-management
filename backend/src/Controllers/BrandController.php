<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class BrandController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM brands ORDER BY name ASC");
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
        $stmt = $this->db->prepare("SELECT * FROM brands WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $id, ':slug' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Marca no encontrada', 404);
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
            return $this->errorResponse($response, 'El nombre de la marca es obligatorio', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'brand-' . uniqid();
        $slug = !empty($body['slug']) ? trim($body['slug']) : $this->generateSlug($name);
        $description = trim($body['description'] ?? '');
        $origin = trim($body['origin'] ?? 'Perú');
        $logoUrl = !empty($body['logoUrl']) ? trim($body['logoUrl']) : null;
        $now = date('c');

        $stmt = $this->db->prepare("
            INSERT INTO brands (id, name, slug, description, origin, logo_url, created_at)
            VALUES (:id, :name, :slug, :description, :origin, :logo_url, :created_at)
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':slug' => $slug,
            ':description' => $description,
            ':origin' => $origin,
            ':logo_url' => $logoUrl,
            ':created_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM brands WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Marca no encontrada', 404);
        }

        $body = (array)$request->getParsedBody();
        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $slug = isset($body['slug']) ? trim($body['slug']) : $existing['slug'];
        $description = isset($body['description']) ? trim($body['description']) : $existing['description'];
        $origin = isset($body['origin']) ? trim($body['origin']) : $existing['origin'];
        $logoUrl = array_key_exists('logoUrl', $body) ? trim((string)$body['logoUrl']) : $existing['logo_url'];

        $updateStmt = $this->db->prepare("
            UPDATE brands SET
                name = :name,
                slug = :slug,
                description = :description,
                origin = :origin,
                logo_url = :logo_url
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':slug' => $slug,
            ':description' => $description,
            ':origin' => $origin,
            ':logo_url' => $logoUrl ?: null,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';

        $prodCheck = $this->db->prepare("SELECT COUNT(*) FROM products WHERE brand_id = :id");
        $prodCheck->execute([':id' => $id]);
        $prodCount = (int)$prodCheck->fetchColumn();

        if ($prodCount > 0) {
            return $this->errorResponse(
                $response,
                "No se puede eliminar la marca porque tiene {$prodCount} producto(s) asociado(s).",
                409
            );
        }

        $stmt = $this->db->prepare("DELETE FROM brands WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Marca eliminada exitosamente',
            'deletedId' => $id,
        ]);
    }

    private function formatBrand(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'] ?? '',
            'origin' => $row['origin'] ?? 'Perú',
            'logoUrl' => $row['logo_url'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
        ];
    }

    private function generateSlug(string $name): string
    {
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        $slug = preg_replace('/[^a-zA-Z0-9 -]/', '', $slug);
        $slug = strtolower(trim(substr($slug, 0, 80)));
        $slug = preg_replace('/[ -]+/', '-', $slug);
        return $slug ?: 'brand-' . uniqid();
    }
}
