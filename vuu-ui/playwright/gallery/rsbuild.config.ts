import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  root: "playwright/gallery",
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./main.tsx",
    },
  },
  html: {
    template: "./index.html",
  },
  output: {
    distPath: {
      root: "./dist",
    },
    cleanDistPath: true,
  },
  server: {
    port: 3100,
  },
  dev: {
    assetPrefix: "/",
  },
  tools: {
    cssLoader: {
      exportType: "string",
    },
  },
});
