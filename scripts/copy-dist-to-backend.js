import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const backendPublicDir = path.resolve(process.cwd(), 'backend/public');

if (fs.existsSync(distDir)) {
  console.log('[build-sync] Copying compiled Vite static assets from dist/ to backend/public/ for zero-Node.js PHP hosting...');
  
  // Clean old assets folder in backend/public to avoid accumulating stale hashed bundles
  const backendAssetsDir = path.join(backendPublicDir, 'assets');
  if (fs.existsSync(backendAssetsDir)) {
    fs.rmSync(backendAssetsDir, { recursive: true, force: true });
  }

  // Recursively copy dist to backend/public
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      // Never overwrite index.php, .htaccess or uploads directory
      if (entry.name === 'index.php' || entry.name === '.htaccess' || entry.name === 'uploads') {
        continue;
      }
      
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(distDir, backendPublicDir);

  // Ensure catalog sample images from src/assets/images are present in backend/public/uploads
  const srcImagesDir = path.resolve(process.cwd(), 'src/assets/images');
  const backendUploadsDir = path.join(backendPublicDir, 'uploads');
  if (fs.existsSync(srcImagesDir)) {
    if (!fs.existsSync(backendUploadsDir)) {
      fs.mkdirSync(backendUploadsDir, { recursive: true });
    }
    const images = fs.readdirSync(srcImagesDir);
    for (const img of images) {
      const srcImg = path.join(srcImagesDir, img);
      const destImg = path.join(backendUploadsDir, img);
      if (fs.statSync(srcImg).isFile() && !fs.existsSync(destImg)) {
        fs.copyFileSync(srcImg, destImg);
      }
    }
  }

  console.log('[build-sync] Successfully synchronized static frontend assets into backend/public/!');
} else {
  console.warn('[build-sync] dist/ folder does not exist yet. Run vite build first.');
}
