import { defineConfig } from "vitest/config";

/**
 * L0 micro-benchmarks: the data layer on its own, no rendering. Run with
 * npm run bench:micro. Kept apart from the unit tests (vitest.config.js)
 * and from the Playwright benchmarks, which also use the .bench.ts suffix.
 */
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["benchmarks/micro/setup.ts"],
    benchmark: {
      include: ["benchmarks/micro/**/*.bench.ts"],
    },
  },
});
