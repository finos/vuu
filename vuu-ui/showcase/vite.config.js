import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    target: "esnext",
  },
  define: {
    "process.env.NODE_DEBUG": false,
    "process.env.LOCAL": false,
    "process.env.LAYOUT_BASE_URL": `"https://localhost:8081/api"`,
  },
  esbuild: {
    jsx: `automatic`,
    target: "esnext",
  },
  server: {
    proxy: {
      "/api/authn": {
        target: "https://localhost:8443",
        secure: false,
      },
    },
  },
  preview: {
    proxy: {
      "/api/authn": {
        target: "https://localhost:8443",
        secure: false,
      },
    },
  },
});
