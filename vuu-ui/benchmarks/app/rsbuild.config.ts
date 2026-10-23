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
 *
 * --env-mode profiling builds the profiling variant into dist/profiling: the
 * same app on React's profiling build, with the React probe installed, for
 * the runner's instrumented pass. bench:build builds both.
 */
export default defineConfig(({ envMode }) => {
  const profiling = envMode === "profiling";
  return {
    root: "benchmarks/app",
    plugins: [pluginReact()],
    source: {
      entry: {
        index: profiling ? "./profiling.ts" : "./main.tsx",
      },
      define: {
        __BENCH_PROFILING__: JSON.stringify(profiling),
        __BENCH_GIT_SHA__: JSON.stringify(gitSha()),
        __BENCH_LABEL__: JSON.stringify(
          process.env.BENCH_LABEL ?? gitSha().slice(0, 10),
        ),
      },
    },
    resolve: profiling
      ? { alias: { "react-dom/client$": "react-dom/profiling" } }
      : undefined,
    html: {
      template: "./index.html",
    },
    output: {
      distPath: {
        root: profiling ? "../dist/profiling" : "../dist",
      },
      // the profiling build is served from /profiling/ of the main build
      ...(profiling ? { assetPrefix: "/profiling/" } : undefined),
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
  };
});
