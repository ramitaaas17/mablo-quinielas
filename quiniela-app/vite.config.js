import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
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
  }
})
