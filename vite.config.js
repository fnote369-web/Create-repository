import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' makes the built asset paths relative, so the app works
// whether it's served from the domain root or a GitHub Pages project
// subpath (https://<user>.github.io/<repo>/) without extra configuration.
// Routing itself uses HashRouter (see src/main.jsx), which needs no
// server-side rewrite rules — a plain static file host is enough.
export default defineConfig({
  base: './',
  plugins: [react()],
})
