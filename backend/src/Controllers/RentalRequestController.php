<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RentalRequestController extends BaseController
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

        if (!empty($params['status'])) {
            $conditions[] = "status = :status";
            $bindings[':status'] = $params['status'];
        }

        if (!empty($params['machineryId'])) {
            $conditions[] = "machinery_id = :machinery_id";
            $bindings[':machinery_id'] = $params['machineryId'];
        }

        if (!empty($params['clientId'])) {
            $conditions[] = "client_id = :client_id";
            $bindings[':client_id'] = $params['clientId'];
        }

        $sql = "SELECT * FROM machinery_rental_requests";
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll();

        return $this->jsonResponse($response, [
            'success' => true,
            'count' => count($rows),
            'data' => array_map([$this, 'formatRequest'], $rows),
        ]);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM machinery_rental_requests WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return $this->errorResponse($response, 'Solicitud de alquiler no encontrada', 404);
        }

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $this->formatRequest($row),
        ]);
    }

    public function create(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        $machineryId = trim($body['machineryId'] ?? '');
        $machineryName = trim($body['machineryName'] ?? '');
        $clientName = trim($body['clientName'] ?? '');
        $clientPhone = trim($body['clientPhone'] ?? '');
        $obraLocation = trim($body['obraLocation'] ?? '');
        $startDate = trim($body['startDate'] ?? '');
        $endDate = trim($body['endDate'] ?? '');

        if (empty($machineryId) || empty($clientName) || empty($clientPhone) || empty($obraLocation)) {
            return $this->errorResponse($response, 'Equipo, nombre del cliente, teléfono y ubicación de obra son obligatorios', 422);
        }

        $id = !empty($body['id']) ? trim($body['id']) : 'rent-req-' . uniqid();
        $machineryBrand = !empty($body['machineryBrand']) ? trim($body['machineryBrand']) : null;
        $machineryModel = !empty($body['machineryModel']) ? trim($body['machineryModel']) : null;
        $machineryImageUrl = !empty($body['machineryImageUrl']) ? trim($body['machineryImageUrl']) : null;
        $clientId = !empty($body['clientId']) ? trim($body['clientId']) : null;
        $clientEmail = trim(strtolower($body['clientEmail'] ?? ''));
        $startHour = !empty($body['startHour']) ? trim($body['startHour']) : '08:00';
        $endHour = !empty($body['endHour']) ? trim($body['endHour']) : '17:00';
        $totalHoursOrDays = !empty($body['totalHoursOrDays']) ? trim($body['totalHoursOrDays']) : null;
        $needsOperator = isset($body['needsOperator']) ? ($body['needsOperator'] ? 1 : 0) : 1;
        $notes = !empty($body['notes']) ? trim($body['notes']) : null;
        $createdBy = in_array($body['createdBy'] ?? '', ['client', 'admin'], true) ? $body['createdBy'] : 'client';
        $status = in_array($body['status'] ?? '', ['pending', 'approved', 'completed', 'rejected'], true) ? $body['status'] : 'pending';
        $approvedBy = !empty($body['approvedBy']) ? trim($body['approvedBy']) : null;
        $approvedAt = !empty($body['approvedAt']) ? trim($body['approvedAt']) : null;
        $now = date('c');

        $stmt = $this->db->prepare("
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

        $stmt->execute([
            ':id' => $id,
            ':machinery_id' => $machineryId,
            ':machinery_name' => $machineryName,
            ':machinery_brand' => $machineryBrand,
            ':machinery_model' => $machineryModel,
            ':machinery_image_url' => $machineryImageUrl,
            ':client_id' => $clientId,
            ':client_name' => $clientName,
            ':client_email' => $clientEmail,
            ':client_phone' => $clientPhone,
            ':obra_location' => $obraLocation,
            ':start_date' => $startDate ?: date('Y-m-d'),
            ':end_date' => $endDate ?: date('Y-m-d'),
            ':start_hour' => $startHour,
            ':end_hour' => $endHour,
            ':total_hours_or_days' => $totalHoursOrDays,
            ':needs_operator' => $needsOperator,
            ':notes' => $notes,
            ':created_by' => $createdBy,
            ':status' => $status,
            ':approved_by' => $approvedBy,
            ':approved_at' => $approvedAt,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("SELECT * FROM machinery_rental_requests WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            return $this->errorResponse($response, 'Solicitud de alquiler no encontrada', 404);
        }

        $body = (array)$request->getParsedBody();
        $machineryId = isset($body['machineryId']) ? trim($body['machineryId']) : $existing['machinery_id'];
        $machineryName = isset($body['machineryName']) ? trim($body['machineryName']) : $existing['machinery_name'];
        $machineryBrand = array_key_exists('machineryBrand', $body) ? trim((string)$body['machineryBrand']) : $existing['machinery_brand'];
        $machineryModel = array_key_exists('machineryModel', $body) ? trim((string)$body['machineryModel']) : $existing['machinery_model'];
        $machineryImageUrl = array_key_exists('machineryImageUrl', $body) ? trim((string)$body['machineryImageUrl']) : $existing['machinery_image_url'];
        $clientId = array_key_exists('clientId', $body) ? trim((string)$body['clientId']) : $existing['client_id'];
        $clientName = isset($body['clientName']) ? trim($body['clientName']) : $existing['client_name'];
        $clientEmail = isset($body['clientEmail']) ? trim(strtolower($body['clientEmail'])) : $existing['client_email'];
        $clientPhone = isset($body['clientPhone']) ? trim($body['clientPhone']) : $existing['client_phone'];
        $obraLocation = isset($body['obraLocation']) ? trim($body['obraLocation']) : $existing['obra_location'];
        $startDate = isset($body['startDate']) ? trim($body['startDate']) : $existing['start_date'];
        $endDate = isset($body['endDate']) ? trim($body['endDate']) : $existing['end_date'];
        $startHour = isset($body['startHour']) ? trim($body['startHour']) : $existing['start_hour'];
        $endHour = isset($body['endHour']) ? trim($body['endHour']) : $existing['end_hour'];
        $totalHoursOrDays = array_key_exists('totalHoursOrDays', $body) ? trim((string)$body['totalHoursOrDays']) : $existing['total_hours_or_days'];
        $needsOperator = isset($body['needsOperator']) ? ($body['needsOperator'] ? 1 : 0) : (int)$existing['needs_operator'];
        $notes = array_key_exists('notes', $body) ? trim((string)$body['notes']) : $existing['notes'];
        $status = isset($body['status']) && in_array($body['status'], ['pending', 'approved', 'completed', 'rejected'], true) ? $body['status'] : $existing['status'];
        $approvedBy = array_key_exists('approvedBy', $body) ? trim((string)$body['approvedBy']) : $existing['approved_by'];
        $approvedAt = array_key_exists('approvedAt', $body) ? trim((string)$body['approvedAt']) : $existing['approved_at'];
        $now = date('c');

        $updateStmt = $this->db->prepare("
            UPDATE machinery_rental_requests SET
                machinery_id = :machinery_id,
                machinery_name = :machinery_name,
                machinery_brand = :machinery_brand,
                machinery_model = :machinery_model,
                machinery_image_url = :machinery_image_url,
                client_id = :client_id,
                client_name = :client_name,
                client_email = :client_email,
                client_phone = :client_phone,
                obra_location = :obra_location,
                start_date = :start_date,
                end_date = :end_date,
                start_hour = :start_hour,
                end_hour = :end_hour,
                total_hours_or_days = :total_hours_or_days,
                needs_operator = :needs_operator,
                notes = :notes,
                status = :status,
                approved_by = :approved_by,
                approved_at = :approved_at,
                updated_at = :updated_at
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':machinery_id' => $machineryId,
            ':machinery_name' => $machineryName,
            ':machinery_brand' => $machineryBrand ?: null,
            ':machinery_model' => $machineryModel ?: null,
            ':machinery_image_url' => $machineryImageUrl ?: null,
            ':client_id' => $clientId ?: null,
            ':client_name' => $clientName,
            ':client_email' => $clientEmail,
            ':client_phone' => $clientPhone,
            ':obra_location' => $obraLocation,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
            ':start_hour' => $startHour,
            ':end_hour' => $endHour,
            ':total_hours_or_days' => $totalHoursOrDays ?: null,
            ':needs_operator' => $needsOperator,
            ':notes' => $notes ?: null,
            ':status' => $status,
            ':approved_by' => $approvedBy ?: null,
            ':approved_at' => $approvedAt ?: null,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        return $this->get($request, $response, ['id' => $id]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $stmt = $this->db->prepare("DELETE FROM machinery_rental_requests WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Solicitud de alquiler eliminada exitosamente',
            'deletedId' => $id,
        ]);
    }

    private function formatRequest(array $row): array
    {
        return [
            'id' => $row['id'],
            'machineryId' => $row['machinery_id'],
            'machineryName' => $row['machinery_name'],
            'machineryBrand' => $row['machinery_brand'] ?? null,
            'machineryModel' => $row['machinery_model'] ?? null,
            'machineryImageUrl' => $row['machinery_image_url'] ?? null,
            'clientId' => $row['client_id'] ?? null,
            'clientName' => $row['client_name'],
            'clientEmail' => $row['client_email'],
            'clientPhone' => $row['client_phone'],
            'obraLocation' => $row['obra_location'],
            'startDate' => $row['start_date'],
            'endDate' => $row['end_date'],
            'startHour' => $row['start_hour'] ?? '08:00',
            'endHour' => $row['end_hour'] ?? '17:00',
            'totalHoursOrDays' => $row['total_hours_or_days'] ?? null,
            'needsOperator' => !empty($row['needs_operator']),
            'notes' => $row['notes'] ?? null,
            'createdBy' => $row['created_by'] ?? 'client',
            'status' => $row['status'] ?? 'pending',
            'approvedBy' => $row['approved_by'] ?? null,
            'approvedAt' => $row['approved_at'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
}
