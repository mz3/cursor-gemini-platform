import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev2-specific configuration
const isDocker = process.env.VITE_DOCKER === 'true';
const apiTarget = isDocker ? 'http://api:4000' : 'http://localhost:4002'; // Use 4002 for dev2

console.log('apiTarget (dev2):', apiTarget);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
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
      '/socket.io': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
});
