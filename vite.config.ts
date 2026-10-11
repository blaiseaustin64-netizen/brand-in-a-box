import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // When testing against a deployed Pages preview, set VITE_API_PROXY
    // or call production /api directly. Local Pages Functions need
    // `wrangler pages dev`.
    proxy: process.env.VITE_API_PROXY
      ? {
          '/api': {
            target: process.env.VITE_API_PROXY,
            changeOrigin: true,
          },
        }
      : undefined,
  },
})
