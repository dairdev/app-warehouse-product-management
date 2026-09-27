import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const PHP_PORT = 8080;

let phpProcess: ChildProcess | null = null;

function startPhpServer(): ChildProcess {
  const backendPublic = path.resolve(process.cwd(), 'backend/public');
  const indexPhp = path.join(backendPublic, 'index.php');

  console.log(`[SlimPHP] Iniciando servidor PHP en http://127.0.0.1:${PHP_PORT}...`);
  const child = spawn('php', ['-S', `127.0.0.1:${PHP_PORT}`, '-t', backendPublic, indexPhp], {
    stdio: 'inherit',
    detached: false,
  });

  child.on('error', (err) => {
    console.error('[SlimPHP] Error al iniciar el servidor PHP:', err.message);
  });

  child.on('exit', (code, signal) => {
    console.log(`[SlimPHP] Servidor PHP finalizó con código: ${code} y señal: ${signal}`);
  });

  return child;
}

// Clean up child process on exit
const cleanup = () => {
  if (phpProcess && !phpProcess.killed) {
    try {
      phpProcess.kill();
    } catch {
      // ignore
    }
  }
};
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit();
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit();
});

async function main() {
  // Start Slim PHP server
  phpProcess = startPhpServer();

  const app = express();

  // Proxy /api requests to Slim PHP
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://127.0.0.1:${PHP_PORT}`,
      changeOrigin: true,
      pathRewrite: (path) => path, // keep /api prefix
      onError: (err, req, res) => {
        console.error('[Proxy Error]:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'No se pudo conectar con el backend Slim PHP',
              details: err.message,
            })
          );
        }
      },
    })
  );

  if (!isProduction) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Aplicación Ferretería Almacenes Nor Oriente ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`[Server] API Slim PHP disponible en http://0.0.0.0:${PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error('[Server Error]:', err);
  process.exit(1);
});
