import { defineConfig } from "@rsbuild/core";
import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginReact } from "@rsbuild/plugin-react";

const collectCoverage = process.env.PLAYWRIGHT_COVERAGE === "1";

export default defineConfig({
  root: "playwright/gallery",
  plugins: [
    pluginReact(),
    ...(collectCoverage
      ? [
          pluginBabel({
            include: /[\\/]packages[\\/].*\.[jt]sx?$/,
            exclude: /[\\/]node_modules[\\/]/,
            babelLoaderOptions: (_config, { addPlugins }) => {
              addPlugins([
                [
                  "babel-plugin-istanbul",
                  {
                    cwd: process.cwd(),
                    exclude: ["**/__tests__/**", "**/*.test.*"],
                  },
                ],
              ]);
            },
          }),
        ]
      : []),
  ],
  source: {
    entry: {
      index:
        process.env.PLAYWRIGHT_GRID_LAYOUT_ONLY === "1"
          ? "./main-grid-layout.tsx"
          : "./main.tsx",
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
    sourceMap: collectCoverage,
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
