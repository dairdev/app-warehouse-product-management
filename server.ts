import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_TAGS,
  INITIAL_MACHINERY,
} from './src/data/initialData';
import { STORE_INFO } from './src/utils/shareUtils';
import { Product, Category, Brand, User, StoreSettings, Tag, Machinery } from './src/types';

const isProduction = process.env.NODE_ENV === 'production';

// Parse port: dev server in AI Studio must ALWAYS bind to port 3000 (DEFAULT_APP_PORT),
// never port 8080 which is reserved for the NGINX reverse proxy.
const args = process.argv.slice(2);
let PORT = 3000;
if (process.env.DEFAULT_APP_PORT) {
  const p = Number(process.env.DEFAULT_APP_PORT);
  if (!isNaN(p) && p > 0) PORT = p;
} else if (process.env.PORT && process.env.PORT !== '8080') {
  const p = Number(process.env.PORT);
  if (!isNaN(p) && p > 0) PORT = p;
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    const val = Number(args[i + 1]);
    if (!isNaN(val) && val > 0 && val !== 8080) PORT = val;
  } else if (args[i].startsWith('--port=')) {
    const val = Number(args[i].split('=')[1]);
    if (!isNaN(val) && val > 0 && val !== 8080) PORT = val;
  }
}

// In-memory state for development API (matches Slim PHP backend)
let currentSettings: StoreSettings = { ...STORE_INFO };
let currentCategories: Category[] = [...INITIAL_CATEGORIES];
let currentBrands: Brand[] = [...INITIAL_BRANDS];
let currentProducts: Product[] = [...INITIAL_PRODUCTS];
let currentUsers: User[] = [...INITIAL_USERS];
let currentTags: Tag[] = [...INITIAL_TAGS];
let currentMachinery: Machinery[] = [...INITIAL_MACHINERY];

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // CORS headers for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // -------------------------------------------------------------------------
  // REST API Endpoints (Parity with Slim PHP 4 Backend)
  // -------------------------------------------------------------------------
  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (_req, res) => {
    res.json({
      status: 'online',
      framework: 'Slim PHP 4 (API Compatibility Layer & Node Dev Engine)',
      php_version: '8.2.0 (Dual Engine: Node Dev / PHP Prod)',
      database: {
        driver: 'sqlite',
        status: 'connected',
        counts: {
          products: currentProducts.length,
          categories: currentCategories.length,
          brands: currentBrands.length,
          users: currentUsers.length,
        },
      },
      server_time: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        products: '/api/products',
        categories: '/api/categories',
        brands: '/api/brands',
        users: '/api/users',
        settings: '/api/settings',
        tags: '/api/tags',
      },
    });
  });

  // Store Settings
  apiRouter.get('/settings', (_req, res) => {
    res.json({ success: true, data: currentSettings });
  });

  apiRouter.put('/settings', (req, res) => {
    currentSettings = { ...currentSettings, ...req.body };
    res.json({ success: true, data: currentSettings });
  });

  // Categories CRUD
  apiRouter.get('/categories', (_req, res) => {
    res.json(currentCategories);
  });

  apiRouter.post('/categories', (req, res) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, '-'),
      ...req.body,
    };
    currentCategories.push(newCategory);
    res.status(201).json(newCategory);
  });

  apiRouter.put('/categories/:id', (req, res) => {
    const idx = currentCategories.findIndex((c) => c.id === req.params.id);
    if (idx !== -1) {
      currentCategories[idx] = { ...currentCategories[idx], ...req.body };
      res.json(currentCategories[idx]);
    } else {
      res.status(404).json({ error: 'Categoría no encontrada' });
    }
  });

  apiRouter.delete('/categories/:id', (req, res) => {
    currentCategories = currentCategories.filter((c) => c.id !== req.params.id);
    res.json({ success: true, message: 'Categoría eliminada' });
  });

  // Brands CRUD
  apiRouter.get('/brands', (_req, res) => {
    res.json(currentBrands);
  });

  apiRouter.post('/brands', (req, res) => {
    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, '-'),
      ...req.body,
    };
    currentBrands.push(newBrand);
    res.status(201).json(newBrand);
  });

  apiRouter.put('/brands/:id', (req, res) => {
    const idx = currentBrands.findIndex((b) => b.id === req.params.id);
    if (idx !== -1) {
      currentBrands[idx] = { ...currentBrands[idx], ...req.body };
      res.json(currentBrands[idx]);
    } else {
      res.status(404).json({ error: 'Marca no encontrada' });
    }
  });

  apiRouter.delete('/brands/:id', (req, res) => {
    currentBrands = currentBrands.filter((b) => b.id !== req.params.id);
    res.json({ success: true, message: 'Marca eliminada' });
  });

  // Products CRUD
  apiRouter.get('/products', (_req, res) => {
    res.json(currentProducts);
  });

  apiRouter.get('/products/:id', (req, res) => {
    const product = currentProducts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  });

  apiRouter.post('/products', (req, res) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: now,
      updatedAt: now,
      ...req.body,
    };
    currentProducts.push(newProduct);
    res.status(201).json(newProduct);
  });

  apiRouter.put('/products/:id', (req, res) => {
    const idx = currentProducts.findIndex((p) => p.id === req.params.id);
    if (idx !== -1) {
      currentProducts[idx] = {
        ...currentProducts[idx],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(currentProducts[idx]);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  });

  apiRouter.delete('/products/:id', (req, res) => {
    currentProducts = currentProducts.filter((p) => p.id !== req.params.id);
    res.json({ success: true, message: 'Producto eliminado' });
  });

  // Users & Auth
  apiRouter.get('/users', (_req, res) => {
    res.json(currentUsers);
  });

  apiRouter.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = currentUsers.find((u) => u.email.toLowerCase() === email?.toLowerCase());
    if (user) {
      res.json({
        success: true,
        user,
        token: `mock-token-${user.id}-${Date.now()}`,
      });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  });

  // Tags
  apiRouter.get('/tags', (_req, res) => {
    res.json(currentTags);
  });

  apiRouter.post('/tags', (req, res) => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      ...req.body,
    };
    currentTags.push(newTag);
    res.status(201).json(newTag);
  });

  // Machinery CRUD
  apiRouter.get('/machinery', (_req, res) => {
    res.json(currentMachinery);
  });

  apiRouter.get('/machinery/:id', (req, res) => {
    const item = currentMachinery.find((m) => m.id === req.params.id || m.slug === req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Maquinaria no encontrada' });
    }
  });

  apiRouter.post('/machinery', (req, res) => {
    const newMach: Machinery = {
      id: `mach-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body,
    };
    currentMachinery.unshift(newMach);
    res.status(201).json(newMach);
  });

  apiRouter.put('/machinery/:id', (req, res) => {
    const idx = currentMachinery.findIndex((m) => m.id === req.params.id);
    if (idx !== -1) {
      currentMachinery[idx] = {
        ...currentMachinery[idx],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(currentMachinery[idx]);
    } else {
      res.status(404).json({ error: 'Maquinaria no encontrada' });
    }
  });

  apiRouter.delete('/machinery/:id', (req, res) => {
    currentMachinery = currentMachinery.filter((m) => m.id !== req.params.id);
    res.json({ success: true, message: 'Maquinaria eliminada' });
  });

  // -------------------------------------------------------------------------
  // File Uploads (Parity with Slim PHP UploadController)
  // -------------------------------------------------------------------------
  const uploadDir = path.resolve(process.cwd(), 'backend/public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const rawName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const randomHex = Math.random().toString(36).substring(2, 8);
      cb(null, `prod_${timestamp}_${randomHex}_${rawName || 'archivo'}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  apiRouter.post('/upload', upload.any(), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo' });
    }

    const isSubPath = req.baseUrl.startsWith('/tienda') || req.originalUrl.startsWith('/tienda');
    const basePrefix = isSubPath ? '/tienda' : '';

    const results = files.map((file) => {
      const ext = path.extname(file.filename).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
      const isPdf = ext === '.pdf';
      return {
        id: `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        url: `${basePrefix}/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        type: isVideo ? 'video' : (isPdf ? 'document' : 'image'),
        mimeType: file.mimetype,
      };
    });

    const isSingle = results.length === 1;
    res.status(201).json({
      success: true,
      message: `${results.length} archivo(s) subido(s) correctamente.`,
      data: isSingle ? results[0] : results,
      items: results,
    });
  });

  apiRouter.delete('/upload/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'Archivo eliminado' });
    }
    res.status(404).json({ success: false, error: 'Archivo no encontrado' });
  });

  // Serve uploaded files statically in Node dev
  app.use('/uploads', express.static(uploadDir));
  app.use('/tienda/uploads', express.static(uploadDir));

  // Mount API router under both /api and /tienda/api
  app.use('/api', apiRouter);
  app.use('/tienda/api', apiRouter);

  // -------------------------------------------------------------------------
  // Vite Frontend Middleware (Development) vs Static Serving (Production)
  // -------------------------------------------------------------------------
  if (!isProduction) {
    const vite = await createViteServer({
      root: process.cwd(),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const backendPublicPath = path.resolve(process.cwd(), 'backend/public');
    const servePath = fs.existsSync(distPath) ? distPath : backendPublicPath;

    if (fs.existsSync(servePath)) {
      app.use(express.static(servePath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(servePath, 'index.html'));
      });
    }
  }

  // Bind server to port 3000
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Ferretería Almacenes Nor Oriente corriendo en http://0.0.0.0:${PORT}`);
    console.log(`[Server] API RESTful lista en http://0.0.0.0:${PORT}/api/health`);
  });

  server.on('error', (err: any) => {
    console.error(`[Server Listen Error]`, err);
    if (err.code === 'EADDRINUSE' && PORT !== 3000) {
      console.log(`Port ${PORT} in use, retrying on port 3000...`);
      app.listen(3000, '0.0.0.0', () => {
        console.log(`[Server] Running on fallback port http://0.0.0.0:3000`);
      });
    }
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Fallo al iniciar el servidor:', err);
  process.exit(1);
});
