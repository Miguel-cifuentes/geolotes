import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Lee el .env desde la raíz del monorepo (geolotes/.env)
  envDir: '..',
  server: {
    // Proxy de desarrollo: imita al API Gateway.
    // El frontend siempre pide /api/lotes; Vite lo reenvía a lotes-service (/lotes).
    // Cuando el Gateway exista, solo cambia el destino a http://localhost:8080
    proxy: {
      '/api/lotes': {
        target: 'http://localhost:8081',
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
      '/api/visitas': {
        target: 'http://localhost:8082',
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
    },
  },
})