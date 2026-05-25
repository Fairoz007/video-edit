import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'strip-crossorigin-for-electron',
      transformIndexHtml(html) {
        // Required for Electron file/app protocol; harmless for Vite preview.
        return html.replace(/\s+crossorigin(="[^"]*")?/g, '');
      },
    },
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3847',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'API starting — retry shortly' }));
            }
          });
        },
      },
      '/health': {
        target: 'http://127.0.0.1:3847',
        changeOrigin: true,
      },
      '/exports': {
        target: 'http://127.0.0.1:3847',
        changeOrigin: true,
      },
      '/cache': {
        target: 'http://127.0.0.1:3847',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
