import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    dangerouslyIgnoreUnhandledErrors: true,
    include: [
      "packages/**/test/**/**.test.(js|ts|tsx)",
      "portal-examples/**/test/**/**.test.(js|ts|tsx)",
    ],
    environment: "happy-dom",
  },
});
