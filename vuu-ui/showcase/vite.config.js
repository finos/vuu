import { defineConfig } from "vite";
import { cssInline } from "../tools/vite-plugin-inline-css/src";
import mdx from "@mdx-js/rollup";

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    target: "esnext",
  },
  define: {
    "process.env.NODE_DEBUG": false,
    "process.env.LOCAL": true,
  },
  esbuild: {
    jsx: `automatic`,
    target: "esnext",
  },
  plugins: [cssInline(), mdx()],
});
