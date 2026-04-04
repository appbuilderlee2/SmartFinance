import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // When serving `dist/` from a subfolder (e.g. VSCode "Go Live"), absolute
  // `/assets/...` URLs 404 and cause a white screen. Use relative base on build.
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  publicDir: 'public', // Explicitly define public dir (default is 'public')
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split big vendor deps for better caching and smaller initial chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router-dom')) return 'vendor-router';
          if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
          if (id.includes('recharts')) return 'vendor-recharts';
          if (id.includes('lucide-react')) return 'vendor-icons';
          // Let Rollup decide the rest to avoid circular manual chunk deps.
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
}))
