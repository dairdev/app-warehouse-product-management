import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const backendPublicDir = path.resolve(process.cwd(), 'backend/public');

if (fs.existsSync(distDir)) {
  console.log('[build-sync] Copying compiled Vite static assets from dist/ to backend/public/ for zero-Node.js PHP hosting...');
  
  // Recursively copy dist to backend/public
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      // Never overwrite index.php or .htaccess
      if (entry.name === 'index.php' || entry.name === '.htaccess') {
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
  console.log('[build-sync] Successfully synchronized static frontend assets into backend/public/!');
} else {
  console.warn('[build-sync] dist/ folder does not exist yet. Run vite build first.');
}
