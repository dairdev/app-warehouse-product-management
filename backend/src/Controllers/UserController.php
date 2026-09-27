<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UserController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT id, name, email, role, phone, company, created_at, updated_at FROM users ORDER BY name ASC");
        $rows = $stmt->fetchAll();

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($rows),
            'data' => array_map([$this, 'formatUser'], $rows),
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT id, name, email, role, phone, company, created_at, updated_at FROM users WHERE id = :id OR email = :email LIMIT 1");
        $stmt->execute([':id' => $id, ':email' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Usuario no encontrado', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatUser($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $name = trim($body['name'] ?? '');
        $email = trim(strtolower($body['email'] ?? ''));
        $role = in_array($body['role'] ?? '', ['admin', 'staff', 'client'], true) ? $body['role'] : 'client';

        if (empty($name) || empty($email)) {
            return $this->errorResponse($response, 'Nombre y correo electrónico son requeridos', 422);
        }

        // Email uniqueness
        $check = $this->db->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
        $check->execute([':email' => $email]);
        if ((int)$check->fetchColumn() > 0) {
            return $this->errorResponse($response, 'El correo electrónico ya se encuentra registrado', 409);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'user-' . uniqid();
        $phone = !empty($body['phone']) ? trim($body['phone']) : null;
        $company = !empty($body['company']) ? trim($body['company']) : null;
        $password = !empty($body['password']) ? password_hash($body['password'], PASSWORD_DEFAULT) : password_hash('123456', PASSWORD_DEFAULT);
        $now = date('c');

        $stmt = $this->db->prepare("
            INSERT INTO users (id, name, email, role, phone, company, password_hash, created_at, updated_at)
            VALUES (:id, :name, :email, :role, :phone, :company, :password_hash, :created_at, :updated_at)
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':email' => $email,
            ':role' => $role,
            ':phone' => $phone,
            ':company' => $company,
            ':password_hash' => $password,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Usuario no encontrado', 404);
        }

        $body = (array)$request->getParsedBody();
        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $role = isset($body['role']) && in_array($body['role'], ['admin', 'staff', 'client'], true) ? $body['role'] : $existing['role'];
        $phone = array_key_exists('phone', $body) ? trim((string)$body['phone']) : $existing['phone'];
        $company = array_key_exists('company', $body) ? trim((string)$body['company']) : $existing['company'];

        $now = date('c');

        $updateStmt = $this->db->prepare("
            UPDATE users SET
                name = :name,
                role = :role,
                phone = :phone,
                company = :company,
                updated_at = :updated_at
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':role' => $role,
            ':phone' => $phone ?: null,
            ':company' => $company ?: null,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Usuario eliminado exitosamente',
            'deletedId' => $id,
        ]);
    }

    public function login(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $email = trim(strtolower($body['email'] ?? ''));

        if (empty($email)) {
            return $this->errorResponse($response, 'El correo electrónico es requerido', 422);
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            return $this->errorResponse($response, 'Usuario no encontrado', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Autenticación exitosa',
            'user' => $this->formatUser($user),
        ]);
    }

    private function formatUser(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'phone' => $row['phone'] ?? null,
            'company' => $row['company'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
}
