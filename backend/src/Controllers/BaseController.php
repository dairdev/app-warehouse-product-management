<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;

abstract class BaseController
{
    protected function jsonResponse(Response $response, mixed $data, int $status = 200): Response
    {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $response->getBody()->write($payload !== false ? $payload : '{}');
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    protected function errorResponse(Response $response, string $message, int $status = 400, ?array $details = null): Response
    {
        $data = [
            'success' => false,
            'error' => $message,
        ];
        if ($details !== null) {
            $data['details'] = $details;
        }

        return $this->jsonResponse($response, $data, $status);
    }
}
