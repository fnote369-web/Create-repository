import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Produces a single self-contained index.html (JS/CSS inlined, no
// relative asset files) under dist-artifact/, purely for sharing a
// clickable preview link (e.g. as a Claude Artifact) without touching
// the GitHub Pages deployment built by the normal `npm run build`.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
  },
})
