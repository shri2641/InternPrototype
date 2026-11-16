import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteApiPlugin from './server/viteApiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
})

