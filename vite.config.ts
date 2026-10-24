import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const values = loadEnv(mode, process.cwd(), 'VITE_API_BASE_URL')
  const target = values.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:8001'
  const proxy = { '/api': { target, changeOrigin: true } }
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Local credentials must never turn a test run into live authentication.
      env: {
        VITE_AUTH_MODE: 'demo',
        VITE_DATA_MODE: 'mock',
        VITE_SAFETY_MAP_MODE: 'mock',
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_PUBLISHABLE_KEY: '',
      },
    },
  }
})
