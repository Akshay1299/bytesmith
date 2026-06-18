import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base ('./') so the same build works at a sub-path (GitHub Pages: /bytesmith/)
// and at a domain root (Vercel / custom domain). Routing is hash-based, so no server
// rewrites are required for it to work.
export default defineConfig({
  base: './',
  plugins: [react()],
});
