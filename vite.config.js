import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(projectDir, 'Frontend');

// The storefront has multiple regular HTML pages and browser scripts rather
// than a single Vite-module application. Copy them into dist so URLs such as
// /login.html, /cart.html, and /admin.html work after deployment too.
const copyStorefrontFiles = {
  name: 'copy-storefront-files',
  closeBundle() {
    const distDir = resolve(frontendDir, 'dist');
    const staticFiles = readdirSync(frontendDir).filter((file) => (
      file === 'styles.css'
      || file.endsWith('.js')
      || (file.endsWith('.html') && file !== 'index.html')
    ));
    staticFiles.forEach((file) => {
      cpSync(resolve(frontendDir, file), resolve(distDir, file));
    });
    cpSync(resolve(frontendDir, 'images'), resolve(distDir, 'images'), { recursive: true });
  }
};

export default defineConfig({
  plugins: [react(), copyStorefrontFiles],
  root: 'Frontend',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001'
    }
  }
});
