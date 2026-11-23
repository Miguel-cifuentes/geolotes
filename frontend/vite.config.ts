import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Respaldo: con SIN_GATEWAY=1 Vite va directo a cada servicio, como antes de tener el Gateway.
// PowerShell:  $env:SIN_GATEWAY=1; npm run dev     (para volver: cierra la terminal o $env:SIN_GATEWAY=$null)
const SIN_GATEWAY = process.env.SIN_GATEWAY === '1'

const quitarApi = (ruta: string) => ruta.replace(/^\/api/, '')

const proxy = SIN_GATEWAY
  ? {
      '/api/lotes': { target: 'http://localhost:8081', rewrite: quitarApi },
      '/api/auth': { target: 'http://localhost:8081', rewrite: quitarApi },
      '/api/visitas': { target: 'http://localhost:8082', rewrite: quitarApi },
    }
  : {
      // Todo /api pasa por el API Gateway, que decide el servicio y quita el prefijo /api
      '/api': { target: 'http://localhost:8080' },
    }

export default defineConfig({
  plugins: [react()],
  // Lee el .env desde la raíz del monorepo (geolotes/.env)
  envDir: '..',
  server: { proxy },
  // npm run preview usa el mismo proxy; acepta el enlace público del túnel de Cloudflare
  preview: {
    proxy,
    allowedHosts: ['.trycloudflare.com'],
  },
})
