/**
 * @vitest-environment node
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ...existing code...
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})