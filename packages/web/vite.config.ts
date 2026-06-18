import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://akshay1299.github.io/bytesmith/ in production; root locally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/bytesmith/' : '/',
  plugins: [react()],
}));
