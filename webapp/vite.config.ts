import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use VITE_DOCKER env var for Docker Compose detection
const isDocker = process.env.VITE_DOCKER === 'true';
const apiTarget = isDocker ? 'http://api:4000' : 'http://localhost:4000';

console.log('apiTarget', apiTarget);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://api:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'cursor-gemini-webapp.fly.dev',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
