import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/app': resolve(__dirname, './src/app'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/features': resolve(__dirname, './src/features'),
      '@/entities': resolve(__dirname, './src/entities'),
      '@/widgets': resolve(__dirname, './src/widgets'),
      '@/shared': resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    host: true
  }
})
