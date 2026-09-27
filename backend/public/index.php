<?php

declare(strict_types=1);

use App\Controllers\BrandController;
use App\Controllers\CategoryController;
use App\Controllers\HealthController;
use App\Controllers\ProductController;
use App\Controllers\SettingsController;
use App\Controllers\TagController;
use App\Controllers\UserController;
use App\Middleware\CorsMiddleware;
use App\Middleware\JsonBodyParserMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

// Parse JSON request bodies
$app->add(new JsonBodyParserMiddleware());

// CORS headers
$app->add(new CorsMiddleware());

// Routing middleware
$app->addRoutingMiddleware();

// Error handling middleware
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Root endpoint
$app->get('/', function (Request $request, Response $response): Response {
    $payload = json_encode([
        'name' => 'API Ferretería Almacenes Nor Oriente',
        'status' => 'online',
        'framework' => 'Slim PHP 4',
        'docs' => '/api/health',
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $response->getBody()->write($payload);
    return $response->withHeader('Content-Type', 'application/json');
});

// Options catch-all for CORS preflights
$app->options('/{routes:.+}', function (Request $request, Response $response): Response {
    return $response;
});

// API Routes group
$app->group('/api', function (RouteCollectorProxy $group): void {
    // Health & Info
    $group->get('/health', [HealthController::class, 'check']);

    // Store Settings
    $group->get('/settings', [SettingsController::class, 'get']);
    $group->put('/settings', [SettingsController::class, 'update']);
    $group->post('/settings', [SettingsController::class, 'update']);

    // Categories CRUD
    $group->get('/categories', [CategoryController::class, 'list']);
    $group->get('/categories/{id}', [CategoryController::class, 'get']);
    $group->post('/categories', [CategoryController::class, 'create']);
    $group->put('/categories/{id}', [CategoryController::class, 'update']);
    $group->delete('/categories/{id}', [CategoryController::class, 'delete']);

    // Brands CRUD
    $group->get('/brands', [BrandController::class, 'list']);
    $group->get('/brands/{id}', [BrandController::class, 'get']);
    $group->post('/brands', [BrandController::class, 'create']);
    $group->put('/brands/{id}', [BrandController::class, 'update']);
    $group->delete('/brands/{id}', [BrandController::class, 'delete']);

    // Products CRUD
    $group->get('/products', [ProductController::class, 'list']);
    $group->get('/products/{id}', [ProductController::class, 'get']);
    $group->post('/products', [ProductController::class, 'create']);
    $group->put('/products/{id}', [ProductController::class, 'update']);
    $group->delete('/products/{id}', [ProductController::class, 'delete']);

    // Users & Roles
    $group->get('/users', [UserController::class, 'list']);
    $group->get('/users/{id}', [UserController::class, 'get']);
    $group->post('/users', [UserController::class, 'create']);
    $group->put('/users/{id}', [UserController::class, 'update']);
    $group->delete('/users/{id}', [UserController::class, 'delete']);
    $group->post('/auth/login', [UserController::class, 'login']);

    // Tags
    $group->get('/tags', [TagController::class, 'list']);
    $group->post('/tags', [TagController::class, 'create']);
});

$app->run();
