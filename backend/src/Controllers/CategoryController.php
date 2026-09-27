<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CategoryController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM categories ORDER BY sort_order ASC, name ASC");
        $rows = $stmt->fetchAll();

        $categories = array_map([$this, 'formatCategory'], $rows);

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($categories),
            'data' => $categories,
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM categories WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $id, ':slug' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Categoría no encontrada', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatCategory($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();

        $name = trim($body['name'] ?? '');
        if (empty($name)) {
            return $this->errorResponse($response, 'El nombre de la categoría es obligatorio', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'cat-' . uniqid();
        $slug = !empty($body['slug']) ? trim($body['slug']) : $this->generateSlug($name);
        $description = trim($body['description'] ?? '');
        $parentId = !empty($body['parentId']) && $body['parentId'] !== 'none' ? trim($body['parentId']) : null;
        $iconName = trim($body['iconName'] ?? 'Package');
        $sortOrder = isset($body['sortOrder']) ? (int)$body['sortOrder'] : 0;
        
        $presentations = null;
        if (!empty($body['defaultPresentations'])) {
            $presentations = is_array($body['defaultPresentations'])
                ? json_encode($body['defaultPresentations'])
                : json_encode(array_filter(array_map('trim', explode(',', (string)$body['defaultPresentations']))));
        }

        $now = date('c');

        $stmt = $this->db->prepare("
            INSERT INTO categories (id, name, slug, description, parent_id, icon_name, sort_order, default_presentations, created_at, updated_at)
            VALUES (:id, :name, :slug, :description, :parent_id, :icon_name, :sort_order, :default_presentations, :created_at, :updated_at)
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':slug' => $slug,
            ':description' => $description,
            ':parent_id' => $parentId,
            ':icon_name' => $iconName,
            ':sort_order' => $sortOrder,
            ':default_presentations' => $presentations,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM categories WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Categoría no encontrada', 404);
        }

        $body = (array)$request->getParsedBody();
        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $slug = isset($body['slug']) ? trim($body['slug']) : $existing['slug'];
        $description = isset($body['description']) ? trim($body['description']) : $existing['description'];
        
        $parentId = $existing['parent_id'];
        if (array_key_exists('parentId', $body)) {
            $parentId = !empty($body['parentId']) && $body['parentId'] !== 'none' ? trim($body['parentId']) : null;
        }

        $iconName = isset($body['iconName']) ? trim($body['iconName']) : $existing['icon_name'];
        $sortOrder = isset($body['sortOrder']) ? (int)$body['sortOrder'] : (int)$existing['sort_order'];

        $presentations = $existing['default_presentations'];
        if (array_key_exists('defaultPresentations', $body)) {
            if (empty($body['defaultPresentations'])) {
                $presentations = null;
            } elseif (is_array($body['defaultPresentations'])) {
                $presentations = json_encode($body['defaultPresentations']);
            } else {
                $presentations = json_encode(array_filter(array_map('trim', explode(',', (string)$body['defaultPresentations']))));
            }
        }

        $now = date('c');

        $updateStmt = $this->db->prepare("
            UPDATE categories SET
                name = :name,
                slug = :slug,
                description = :description,
                parent_id = :parent_id,
                icon_name = :icon_name,
                sort_order = :sort_order,
                default_presentations = :default_presentations,
                updated_at = :updated_at
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':slug' => $slug,
            ':description' => $description,
            ':parent_id' => $parentId,
            ':icon_name' => $iconName,
            ':sort_order' => $sortOrder,
            ':default_presentations' => $presentations,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';

        // Check if there are products with this category or subcategory
        $prodCheck = $this->db->prepare("SELECT COUNT(*) FROM products WHERE category_id = :id OR subcategory_id = :sub_id");
        $prodCheck->execute([':id' => $id, ':sub_id' => $id]);
        $prodCount = (int)$prodCheck->fetchColumn();

        if ($prodCount > 0) {
            return $this->errorResponse(
                $response,
                "No se puede eliminar la categoría porque tiene {$prodCount} producto(s) asignado(s). Reasigne los productos primero.",
                409
            );
        }

        // Check if there are subcategories
        $childCheck = $this->db->prepare("SELECT COUNT(*) FROM categories WHERE parent_id = :id");
        $childCheck->execute([':id' => $id]);
        $childCount = (int)$childCheck->fetchColumn();

        if ($childCount > 0) {
            return $this->errorResponse(
                $response,
                "No se puede eliminar la categoría porque contiene {$childCount} subcategoría(s). Elimínelas o muévalas primero.",
                409
            );
        }

        $stmt = $this->db->prepare("DELETE FROM categories WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Categoría eliminada exitosamente',
            'deletedId' => $id,
        ]);
    }

    private function formatCategory(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'] ?? '',
            'parentId' => $row['parent_id'],
            'iconName' => $row['icon_name'] ?? 'Package',
            'sortOrder' => (int)($row['sort_order'] ?? 0),
            'defaultPresentations' => !empty($row['default_presentations']) ? json_decode($row['default_presentations'], true) : [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    private function generateSlug(string $name): string
    {
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        $slug = preg_replace('/[^a-zA-Z0-9 -]/', '', $slug);
        $slug = strtolower(trim(substr($slug, 0, 80)));
        $slug = preg_replace('/[ -]+/', '-', $slug);
        return $slug ?: 'cat-' . uniqid();
    }
}
