import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Met Éireann's open endpoint is HTTP-only, so dev requests go through
      // this same-origin proxy. Production uses api/met-eireann.js (Vercel)
      // or netlify/functions/met-eireann.mjs.
      '/api/met-eireann': {
        target: 'http://openaccess.pf.api.met.ie',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/met-eireann/, '/metno-wdb2ts/locationforecast'),
      },
    },
  },
})
