import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// BASE: the path the site is served from. The site lives at the root of its domain
// (Cloudflare Pages). Only if it has to live in a sub-folder, build with
// e.g. BASE_PATH=/portfolio/ npm run build
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig(({ mode }) => {
  // `npm run build:single` makes one self-contained index.html (handy for sharing a preview file)
  if (mode === 'single') {
    return {
      base: './',
      plugins: [react(), viteSingleFile()],
      build: { outDir: 'dist-single', assetsInlineLimit: 100_000_000 },
    };
  }

  return {
    base: BASE,
    plugins: [react()],
    // three.js is loaded with React.lazy in Hero.jsx, so it gets its own file automatically
    build: { chunkSizeWarningLimit: 900 },
  };
});
