import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['all'],
    host: '0.0.0.0',
    port: 4200,
    hmr: {
      host: 'localhost'
    }
  },
  build: {
    rollupOptions: {
      external: []
    }
  },
  optimizeDeps: {
    exclude: []
  },
  define: {
    global: 'globalThis'
  }
}); 