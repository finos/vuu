import { defineConfig } from "vite";
import { cssInline } from "../tools/vite-plugin-inline-css/src";

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    target: "esnext",
  },
  define: {
    "process.env.NODE_DEBUG": false,
    "process.env.LOCAL": true,
    "process.env.LAYOUT_BASE_URL": `"http://127.0.0.1:8081/api"`,
  },
  esbuild: {
    jsx: `automatic`,
    target: "esnext",
  },
  plugins: [cssInline()],
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
