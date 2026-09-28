<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;

class UploadController extends BaseController
{
    private const ALLOWED_EXTENSIONS = [
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'webp' => 'image/webp',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'bmp'  => 'image/bmp',
        'avif' => 'image/avif',
        'mp4'  => 'video/mp4',
        'webm' => 'video/webm',
        'ogg'  => 'video/ogg',
        'mov'  => 'video/quicktime',
        'pdf'  => 'application/pdf',
    ];

    private const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

    /**
     * Upload one or multiple files
     */
    public function upload(Request $request, Response $response): Response
    {
        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles)) {
            return $this->errorResponse($response, 'No se ha enviado ningún archivo en la petición.', 400);
        }

        // Determine destination upload path
        $uploadDir = $this->getUploadDirectory();
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
                return $this->errorResponse(
                    $response,
                    'No se pudo crear la carpeta de subidas en el servidor. Verifique permisos de escritura en public/uploads/.',
                    500
                );
            }
        }

        if (!is_writable($uploadDir)) {
            return $this->errorResponse(
                $response,
                'La carpeta de subidas (public/uploads/) no tiene permisos de escritura en el servidor (chmod 775 recomendado).',
                500
            );
        }

        // Flatten all files into a list to support both 'file', 'files', 'image', etc.
        $filesToProcess = [];
        foreach ($uploadedFiles as $key => $fileOrList) {
            if (is_array($fileOrList)) {
                foreach ($fileOrList as $f) {
                    if ($f instanceof UploadedFileInterface) {
                        $filesToProcess[] = $f;
                    }
                }
            } elseif ($fileOrList instanceof UploadedFileInterface) {
                $filesToProcess[] = $fileOrList;
            }
        }

        if (empty($filesToProcess)) {
            return $this->errorResponse($response, 'No se detectaron archivos válidos en los campos enviados.', 400);
        }

        $results = [];
        $basePrefix = $this->determineBasePrefix($request);

        foreach ($filesToProcess as $uploadedFile) {
            if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
                $errorMessage = $this->getUploadErrorMessage($uploadedFile->getError());
                return $this->errorResponse($response, "Error al subir '{$uploadedFile->getClientFilename()}': {$errorMessage}", 400);
            }

            if ($uploadedFile->getSize() > self::MAX_FILE_SIZE) {
                $maxMb = self::MAX_FILE_SIZE / (1024 * 1024);
                return $this->errorResponse($response, "El archivo '{$uploadedFile->getClientFilename()}' excede el límite máximo permitido de {$maxMb}MB.", 413);
            }

            $clientFilename = $uploadedFile->getClientFilename() ?? 'archivo';
            $extension = strtolower(pathinfo($clientFilename, PATHINFO_EXTENSION));

            if (!array_key_exists($extension, self::ALLOWED_EXTENSIONS)) {
                $allowedList = implode(', ', array_keys(self::ALLOWED_EXTENSIONS));
                return $this->errorResponse(
                    $response,
                    "Formato de archivo no permitido (.{$extension}). Formatos válidos: {$allowedList}",
                    415
                );
            }

            // Generate safe, unique filename
            $safeName = $this->sanitizeFilename(pathinfo($clientFilename, PATHINFO_FILENAME));
            $randomHex = bin2hex(random_bytes(4));
            $timestamp = date('Ymd_His');
            $uniqueFilename = "prod_{$timestamp}_{$randomHex}_{$safeName}.{$extension}";

            $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $uniqueFilename;

            try {
                $uploadedFile->moveTo($targetPath);
            } catch (\Throwable $e) {
                return $this->errorResponse($response, 'Error al guardar el archivo en el servidor: ' . $e->getMessage(), 500);
            }

            $isVideo = in_array($extension, ['mp4', 'webm', 'ogg', 'mov'], true);
            $isPdf = $extension === 'pdf';
            $mediaType = $isVideo ? 'video' : ($isPdf ? 'document' : 'image');

            // Public relative URL that works on both subdomain (/) and subfolder (/tienda)
            $publicUrl = $basePrefix . '/uploads/' . $uniqueFilename;

            $fileData = [
                'id'           => 'up-' . $randomHex,
                'url'          => $publicUrl,
                'filename'     => $uniqueFilename,
                'originalName' => $clientFilename,
                'size'         => $uploadedFile->getSize(),
                'type'         => $mediaType,
                'mimeType'     => self::ALLOWED_EXTENSIONS[$extension] ?? $uploadedFile->getClientMediaType(),
            ];

            $results[] = $fileData;
        }

        // Return single object if only 1 file was uploaded, or array if multiple
        $isSingle = count($results) === 1 && !isset($uploadedFiles['files']);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => count($results) . ' archivo(s) subido(s) correctamente.',
            'data'    => $isSingle ? $results[0] : $results,
            'items'   => $results,
        ], 201);
    }

    /**
     * Delete an uploaded file
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $filename = basename($args['filename'] ?? '');
        if (empty($filename)) {
            return $this->errorResponse($response, 'Nombre de archivo no especificado.', 400);
        }

        $uploadDir = $this->getUploadDirectory();
        $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;

        if (file_exists($targetPath) && is_file($targetPath)) {
            @unlink($targetPath);
            return $this->jsonResponse($response, [
                'success'  => true,
                'message'  => 'Archivo eliminado exitosamente.',
                'filename' => $filename,
            ]);
        }

        return $this->errorResponse($response, 'Archivo no encontrado en el servidor.', 404);
    }

    private function getUploadDirectory(): string
    {
        // Try backend/public/uploads or current directory uploads
        $paths = [
            __DIR__ . '/../../public/uploads',
            dirname(__DIR__, 2) . '/public/uploads',
            dirname(__DIR__, 1) . '/public/uploads',
            $_SERVER['DOCUMENT_ROOT'] . '/uploads',
        ];

        foreach ($paths as $path) {
            if (is_dir($path)) {
                return realpath($path) ?: $path;
            }
        }

        return __DIR__ . '/../../public/uploads';
    }

    private function determineBasePrefix(Request $request): string
    {
        $uriPath = $request->getUri()->getPath();
        $reqUri = $_SERVER['REQUEST_URI'] ?? '';

        if (str_starts_with($uriPath, '/tienda') || str_starts_with($reqUri, '/tienda')) {
            return '/tienda';
        }

        return '';
    }

    private function sanitizeFilename(string $name): string
    {
        $clean = iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        $clean = preg_replace('/[^a-zA-Z0-9_-]/', '_', $clean);
        $clean = trim((string)$clean, '_');
        return substr($clean, 0, 30) ?: 'archivo';
    }

    private function getUploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE   => 'El archivo excede la directiva upload_max_filesize en php.ini.',
            UPLOAD_ERR_FORM_SIZE  => 'El archivo excede la directiva MAX_FILE_SIZE especificada en el formulario.',
            UPLOAD_ERR_PARTIAL    => 'El archivo se subió solo parcialmente.',
            UPLOAD_ERR_NO_FILE    => 'No se subió ningún archivo.',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal en el servidor.',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en el disco.',
            UPLOAD_ERR_EXTENSION  => 'Una extensión de PHP detuvo la subida de archivos.',
            default               => 'Error desconocido de subida (Código: ' . $code . ').',
        };
    }
}
