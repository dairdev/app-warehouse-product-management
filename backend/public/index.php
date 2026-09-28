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

$autoloadFiles = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
    dirname(__DIR__) . '/vendor/autoload.php',
];

$autoloadLoaded = false;
foreach ($autoloadFiles as $file) {
    if (file_exists($file)) {
        require $file;
        $autoloadLoaded = true;
        break;
    }
}

if (!$autoloadLoaded) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Dependency Error',
        'message' => 'No se encontró el autoloader de Composer (vendor/autoload.php).',
        'tip' => 'Asegúrese de subir la carpeta vendor/ o ejecutar "composer install".'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$app = AppFactory::create();

// Routing middleware (innermost)
$app->addRoutingMiddleware();

// Parse JSON request bodies
$app->add(new JsonBodyParserMiddleware());

// CORS middleware (runs before routing to handle OPTIONS preflights cleanly)
$app->add(new CorsMiddleware());

// Error handling middleware (outermost)
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Serve static assets from /assets/ if requested through PHP
$app->get('/assets/{file:.+}', function (Request $request, Response $response, array $args): Response {
    $filePath = __DIR__ . '/assets/' . $args['file'];
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'js' => 'application/javascript; charset=utf-8',
            'mjs' => 'application/javascript; charset=utf-8',
            'css' => 'text/css; charset=utf-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'json' => 'application/json; charset=utf-8',
        ];
        $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';
        $response->getBody()->write((string) file_get_contents($filePath));
        return $response
            ->withHeader('Content-Type', $contentType)
            ->withHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
    return $response->withStatus(404);
});

// Serve favicon SVG / ICO if requested through PHP
$serveFavicon = function (Request $request, Response $response, string $filename): Response {
    $filePath = __DIR__ . '/' . $filename;
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $contentType = $ext === 'svg' ? 'image/svg+xml' : 'image/x-icon';
        $response->getBody()->write((string) file_get_contents($filePath));
        return $response
            ->withHeader('Content-Type', $contentType)
            ->withHeader('Cache-Control', 'public, max-age=604800');
    }
    return $response->withStatus(404);
};

$app->get('/favicon.svg', fn(Request $req, Response $res) => $serveFavicon($req, $res, 'favicon.svg'));
$app->get('/favicon.ico', fn(Request $req, Response $res) => $serveFavicon($req, $res, 'favicon.ico'));
$app->get('/tienda/favicon.svg', fn(Request $req, Response $res) => $serveFavicon($req, $res, 'favicon.svg'));
$app->get('/tienda/favicon.ico', fn(Request $req, Response $res) => $serveFavicon($req, $res, 'favicon.ico'));

// Root endpoint: Serves the React SPA index.html to browsers, or API metadata to JSON clients
$app->get('/', function (Request $request, Response $response): Response {
    $acceptHeader = $request->getHeaderLine('Accept');
    $indexPath = __DIR__ . '/index.html';

    // If browser visits and index.html exists, serve the React Frontend
    if (file_exists($indexPath) && (!str_contains($acceptHeader, 'application/json') || str_contains($acceptHeader, 'text/html'))) {
        $response->getBody()->write((string) file_get_contents($indexPath));
        return $response->withHeader('Content-Type', 'text/html; charset=utf-8');
    }

    $payload = json_encode([
        'name' => 'API Ferretería Almacenes Nor Oriente',
        'status' => 'online',
        'framework' => 'Slim PHP 4 (PSR-7 / PSR-15)',
        'spa_ready' => file_exists($indexPath),
        'docs' => '/api/health',
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $response->getBody()->write($payload);
    return $response->withHeader('Content-Type', 'application/json');
});

// Register application API routes
$registerApiRoutes = function (RouteCollectorProxy $group): void {
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
};

// Mount routes under /api, /tienda/api, and also root for proxy compatibility
$app->group('/api', $registerApiRoutes);
$app->group('/tienda/api', $registerApiRoutes);
$app->group('', $registerApiRoutes);

// SPA Fallback Route: Any non-API frontend route (e.g. /catalogo, /admin) is served with index.html
$app->get('/{routes:.+}', function (Request $request, Response $response): Response {
    $indexPath = __DIR__ . '/index.html';
    if (file_exists($indexPath)) {
        $response->getBody()->write((string) file_get_contents($indexPath));
        return $response->withHeader('Content-Type', 'text/html; charset=utf-8');
    }

    $payload = json_encode([
        'error' => 'Not Found',
        'message' => 'Ruta no encontrada y el frontend compilado (index.html) aún no ha sido generado en backend/public/.',
        'tip' => 'Ejecute "npm run build" para compilar y sincronizar los archivos estáticos.'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $response->getBody()->write($payload);
    return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
});

$app->run();
