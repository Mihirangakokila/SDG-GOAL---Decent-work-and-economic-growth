import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // FIX: proxy /socket.io WebSocket upgrades through Vite dev server
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,  // <-- this is what enables WebSocket proxying
      },
    }
  }
})
