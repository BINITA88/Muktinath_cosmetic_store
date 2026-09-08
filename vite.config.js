import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(projectDir, 'Frontend');

// The storefront uses regular browser scripts rather than Vite modules. Copy
// them (and their product-image folder) into the deployed dist folder so the
// production site has the same complete UI as localhost.
const copyStorefrontFiles = {
  name: 'copy-storefront-files',
  closeBundle() {
    const distDir = resolve(frontendDir, 'dist');
    ['store-data.js', 'common.js', 'main.js'].forEach((file) => {
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
