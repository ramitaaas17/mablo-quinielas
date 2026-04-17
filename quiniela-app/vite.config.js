import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/quinielas': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/predicciones': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000'
    }
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Raise chunk size warning threshold (we have large vendor chunks by design)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libs from app code for better long-term caching
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router/')) {
            return 'router';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'ui';
          }
        }
      }
    },
    // Generate source maps for error tracking in prod (optional, remove if not using Sentry etc)
    sourcemap: false,
  },
  // Optimise deps pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
  },
})
