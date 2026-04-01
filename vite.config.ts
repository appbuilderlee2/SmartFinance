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
  },
  server: {
    port: 3000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
}))
