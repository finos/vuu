import { execSync } from "node:child_process";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const gitSha = () => {
  try {
    const sha = execSync("git rev-parse HEAD").toString().trim();
    const dirty = execSync("git status --porcelain -- .").toString().trim();
    return dirty ? `${sha}-dirty` : sha;
  } catch {
    return "unknown";
  }
};

/**
 * Benchmark host app. Always benchmark the production build (bench:build),
 * React development mode inflates render costs many times over. bench:dev
 * is for working on the scenarios themselves.
 */
export default defineConfig({
  root: "benchmarks/app",
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./main.tsx",
    },
    define: {
      __BENCH_GIT_SHA__: JSON.stringify(gitSha()),
    },
  },
  html: {
    template: "./index.html",
  },
  output: {
    distPath: {
      root: "../dist",
    },
    cleanDistPath: true,
  },
  server: {
    port: 3200,
  },
  tools: {
    cssLoader: {
      exportType: "string",
    },
  },
});
