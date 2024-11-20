import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    dangerouslyIgnoreUnhandledErrors: true,
    include: ["test/**/**.test.(js|ts|tsx)"],
    environment: "happy-dom",
  },
});
