import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite yapılandırması
// - Geliştirme sunucusu 0.0.0.0'a bağlanır (harici erişim / canlı önizleme için)
// - /api istekleri Express sunucusuna (port 4000) proxy'lenir
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Canlı önizleme ortamının host'larına izin ver (*.e2b.app)
    allowedHosts: ['.e2b.app'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.e2b.app'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
