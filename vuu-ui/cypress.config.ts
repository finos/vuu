import { defineConfig } from "cypress";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { UserConfig } from "vite";
import { version as reactVersion } from "react";
import { cssInline } from "vite-plugin-inline-css";

const viteConfig: UserConfig = {
  plugins: [react(), tsconfigPaths(), /*, IstanbulPlugin()*/ cssInline()],
  server: {
    watch: {
      ignored: ["**/coverage"],
    },
  },
  build: {
    sourcemap: true,
  },
  define: {
    "process.env.NODE_DEBUG": false,
    "process.env.LOCAL": true,
  },
  resolve: {
    alias: {
      "cypress/react18": reactVersion.startsWith("18")
        ? "cypress/react18"
        : "cypress/react",
    },
  },
};

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 1024,
  video: false,
  component: {
    scrollBehavior: false,
    setupNodeEvents(on, config) {
      // installCoverageTask(on, config);
      //Setting up a log task to allow logging to the console during an axe test because console.log() does not work directly in a test
      on("task", {
        log(message: string) {
          console.log(message);

          return null;
        },
      });
      return config;
    },
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig,
    },
    specPattern: "packages/**/src/**/*.cy.{js,ts,jsx,tsx}",
    indexHtmlFile: "cypress/support/component/component-index.html",
  },
});
