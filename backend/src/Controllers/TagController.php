<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TagController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM tags ORDER BY name ASC");
        $rows = $stmt->fetchAll();

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($rows),
            'data' => $rows,
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $name = trim($body['name'] ?? '');
        $color = trim($body['color'] ?? 'yellow');

        if (empty($name)) {
            return $this->errorResponse($response, 'El nombre de la etiqueta es obligatorio', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'tag-' . uniqid();
        $slug = !empty($body['slug']) ? trim($body['slug']) : strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));

        $stmt = $this->db->prepare("INSERT INTO tags (id, name, slug, color) VALUES (:id, :name, :slug, :color)");
        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':slug' => $slug,
            ':color' => $color,
        ]);

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                'id' => $id,
                'name' => $name,
                'slug' => $slug,
                'color' => $color,
            ],
        ], 201);
    }
}
