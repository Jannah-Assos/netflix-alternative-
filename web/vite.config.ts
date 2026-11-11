import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8787' },
  },
  // Aucune ressource n'est incorporée en data: URI : la politique de sécurité n'autorise que 'self'.
  build: { outDir: 'dist', sourcemap: false, assetsInlineLimit: 0 },
});
