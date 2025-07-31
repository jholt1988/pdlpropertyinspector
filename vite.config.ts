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
})