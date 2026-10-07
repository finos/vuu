import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    benchmark: {
      include: ["packages/**/bench/**/*.bench.ts"],
    },
    dangerouslyIgnoreUnhandledErrors: true,
    include: [
      "packages/**/test/**/**.test.(js|ts|tsx)",
      "sample-apps/app-vuu-example/test/**/**.test.(js|ts|tsx)",
      "portal-examples/**/test/**/**.test.(js|ts|tsx)",
      "tools/portal-build-tool/test/**/**.test.(js|ts|tsx)",
    ],
    environment: "happy-dom",
    server: {
      deps: {
        // the data engine packages depend on @vuu-ui workspace packages,
        // which are published as typescript source, so must be transformed
        inline: [/@heswell\/vuu-/],
      },
    },
  },
});
