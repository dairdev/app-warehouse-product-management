<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ClientController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function list(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $q = trim($params['q'] ?? '');

        if ($q !== '') {
            $stmt = $this->db->prepare("
                SELECT * FROM clients 
                WHERE name LIKE :q 
                   OR email LIKE :q 
                   OR phone LIKE :q 
                   OR company LIKE :q 
                   OR document_number LIKE :q
                ORDER BY created_at DESC
            ");
            $stmt->execute([':q' => "%{$q}%"]);
        } else {
            $stmt = $this->db->query("SELECT * FROM clients ORDER BY created_at DESC");
        }

        $rows = $stmt->fetchAll();

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($rows),
            'data' => array_map([$this, 'formatClient'], $rows),
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM clients WHERE id = :id OR email = :email LIMIT 1");
        $stmt->execute([':id' => $id, ':email' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Cliente no encontrado', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatClient($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $name = trim($body['name'] ?? '');
        $email = trim(strtolower($body['email'] ?? ''));
        $phone = trim($body['phone'] ?? '');

        if (empty($name) || empty($phone)) {
            return $this->errorResponse($response, 'El nombre y teléfono del cliente son requeridos', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'client-' . uniqid();
        $company = !empty($body['company']) ? trim($body['company']) : null;
        $documentType = in_array($body['documentType'] ?? '', ['DNI', 'RUC', 'CE'], true) ? $body['documentType'] : 'RUC';
        $documentNumber = !empty($body['documentNumber']) ? trim($body['documentNumber']) : null;
        $address = !empty($body['address']) ? trim($body['address']) : null;
        $notes = !empty($body['notes']) ? trim($body['notes']) : null;
        $userId = !empty($body['userId']) ? trim($body['userId']) : null;
        $now = date('c');

        $stmt = $this->db->prepare("
            INSERT INTO clients (
                id, name, email, phone, company, document_type, document_number, address, notes, user_id, created_at, updated_at
            ) VALUES (
                :id, :name, :email, :phone, :company, :document_type, :document_number, :address, :notes, :user_id, :created_at, :updated_at
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':company' => $company,
            ':document_type' => $documentType,
            ':document_number' => $documentNumber,
            ':address' => $address,
            ':notes' => $notes,
            ':user_id' => $userId,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM clients WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Cliente no encontrado', 404);
        }

        $body = (array)$request->getParsedBody();
        $name = isset($body['name']) ? trim($body['name']) : $existing['name'];
        $email = isset($body['email']) ? trim(strtolower($body['email'])) : $existing['email'];
        $phone = isset($body['phone']) ? trim($body['phone']) : $existing['phone'];
        $company = array_key_exists('company', $body) ? trim((string)$body['company']) : $existing['company'];
        $documentType = isset($body['documentType']) && in_array($body['documentType'], ['DNI', 'RUC', 'CE'], true) ? $body['documentType'] : $existing['document_type'];
        $documentNumber = array_key_exists('documentNumber', $body) ? trim((string)$body['documentNumber']) : $existing['document_number'];
        $address = array_key_exists('address', $body) ? trim((string)$body['address']) : $existing['address'];
        $notes = array_key_exists('notes', $body) ? trim((string)$body['notes']) : $existing['notes'];
        $userId = array_key_exists('userId', $body) ? trim((string)$body['userId']) : $existing['user_id'];
        $now = date('c');

        $updateStmt = $this->db->prepare("
            UPDATE clients SET
                name = :name,
                email = :email,
                phone = :phone,
                company = :company,
                document_type = :document_type,
                document_number = :document_number,
                address = :address,
                notes = :notes,
                user_id = :user_id,
                updated_at = :updated_at
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':company' => $company ?: null,
            ':document_type' => $documentType,
            ':document_number' => $documentNumber ?: null,
            ':address' => $address ?: null,
            ':notes' => $notes ?: null,
            ':user_id' => $userId ?: null,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("DELETE FROM clients WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Cliente eliminado del sistema',
            'deletedId' => $id,
        ]);
    }

    private function formatClient(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'company' => $row['company'] ?? null,
            'documentType' => $row['document_type'] ?? 'RUC',
            'documentNumber' => $row['document_number'] ?? null,
            'address' => $row['address'] ?? null,
            'notes' => $row['notes'] ?? null,
            'userId' => $row['user_id'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
}
