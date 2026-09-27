<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class HealthController extends BaseController
{
    public function check(Request $request, Response $response): Response
    {
        $db = Database::getConnection();
        $dbDriver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);

        $tables = [
            'products' => (int)$db->query("SELECT COUNT(*) FROM products")->fetchColumn(),
            'categories' => (int)$db->query("SELECT COUNT(*) FROM categories")->fetchColumn(),
            'brands' => (int)$db->query("SELECT COUNT(*) FROM brands")->fetchColumn(),
            'users' => (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
            'tags' => (int)$db->query("SELECT COUNT(*) FROM tags")->fetchColumn(),
            'store_settings' => (int)$db->query("SELECT COUNT(*) FROM store_settings")->fetchColumn(),
        ];

        return $this->jsonResponse($response, [
            'status' => 'online',
            'framework' => 'Slim PHP 4 (PSR-7 / PSR-15)',
            'php_version' => PHP_VERSION,
            'database' => [
                'driver' => $dbDriver,
                'status' => 'connected',
                'counts' => $tables,
            ],
            'server_time' => date('c'),
            'endpoints' => [
                'health' => 'GET /api/health',
                'categories' => [
                    'GET /api/categories',
                    'GET /api/categories/{id}',
                    'POST /api/categories',
                    'PUT /api/categories/{id}',
                    'DELETE /api/categories/{id}',
                ],
                'products' => [
                    'GET /api/products',
                    'GET /api/products/{id}',
                    'POST /api/products',
                    'PUT /api/products/{id}',
                    'DELETE /api/products/{id}',
                ],
                'brands' => [
                    'GET /api/brands',
                    'GET /api/brands/{id}',
                    'POST /api/brands',
                    'PUT /api/brands/{id}',
                    'DELETE /api/brands/{id}',
                ],
                'settings' => [
                    'GET /api/settings',
                    'PUT /api/settings',
                ],
                'users' => [
                    'GET /api/users',
                    'GET /api/users/{id}',
                    'POST /api/users',
                    'PUT /api/users/{id}',
                    'DELETE /api/users/{id}',
                    'POST /api/auth/login',
                ],
                'tags' => [
                    'GET /api/tags',
                    'POST /api/tags',
                ],
            ],
        ]);
    }
}
