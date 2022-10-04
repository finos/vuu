import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env.NODE_DEBUG': false
  },
  esbuild: {
    jsx: `automatic`,
    target: 'esnext'
  },
  plugins: [],
  server: {
    proxy: {
      '/api/authn': {
        target: 'https://localhost:8443',
        secure: false
      }
    }
  }
});
