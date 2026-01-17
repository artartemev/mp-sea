// my-marketplace-app/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Явно указываем, что папка dist должна создаваться здесь
    outDir: 'dist',
  },
  server: {
    host: true,
    allowedHosts: [
      'd428-202-58-201-142.ngrok-free.app'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
