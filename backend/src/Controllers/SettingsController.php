<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class SettingsController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function get(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT `key`, `value` FROM store_settings");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'];
        }

        // Defaults if missing
        $defaults = [
            'name' => 'Almacenes Nor Oriente',
            'phone' => '+51 987 654 321',
            'whatsappNumber' => '51987654321',
            'email' => 'ventas@almacenesnororiente.com',
            'address' => 'Av. Circunvalación Norte 1420, Sector Industrial',
            'city' => 'Tarapoto / San Martín - Perú',
            'ruc' => '20601234567',
            'schedule' => 'Lunes a Sábado: 7:00 am - 6:00 pm',
            'website' => '',
            'catalogHeaderBadge' => 'Distribución Mayorista & Menorista Directo a Obra',
            'catalogHeaderTitle' => 'Materiales de Construcción Pesada & Fichas Técnicas',
            'catalogHeaderSubtitle' => 'Precios por mayor, stock certificado bajo normas ASTM / NTP y cotización directa por WhatsApp para ingenieros, maestros de obra y constructoras.',
            'headerTagline' => 'Materiales de Construcción · Selva Central & Norte',
            'profileHeaderTitle' => 'Datos de la Obra / Cliente',
            'profileHeaderSubtitle' => 'Perfil de Obra & Lista de Materiales Etiquetados',
        ];

        $result = array_merge($defaults, $settings);

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => $result,
        ]);
    }

    public function update(Request $request, Response $response): Response
    {
        $body = (array)$request->getParsedBody();
        if (empty($body)) {
            return $this->errorResponse($response, 'No se proporcionaron datos de configuración', 422);
        }

        $allowedKeys = [
            'name', 'phone', 'whatsappNumber', 'email', 'address',
            'city', 'ruc', 'schedule', 'website',
            'catalogHeaderBadge', 'catalogHeaderTitle', 'catalogHeaderSubtitle',
            'headerTagline', 'profileHeaderTitle', 'profileHeaderSubtitle',
        ];

        $stmt = $this->db->prepare("REPLACE INTO store_settings (`key`, `value`) VALUES (:key, :value)");

        foreach ($body as $key => $val) {
            if (in_array($key, $allowedKeys, true)) {
                $stmt->execute([
                    ':key' => $key,
                    ':value' => (string)$val,
                ]);
            }
        }

        return $this->get($request, $response);
    }
}
