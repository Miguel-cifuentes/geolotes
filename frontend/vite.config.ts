import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Lee el .env desde la raíz del monorepo (geolotes/.env)
  envDir: '..',
})
