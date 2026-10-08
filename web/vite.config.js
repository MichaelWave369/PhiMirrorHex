import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Project Pages deployment: https://michaelwave369.github.io/PhiMirrorHex/
  base: '/PhiMirrorHex/',
  build: { outDir: 'dist', sourcemap: false, emptyOutDir: true },
  server: { fs: { allow: ['..'] } },
});
