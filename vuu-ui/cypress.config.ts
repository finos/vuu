import { defineConfig } from "cypress";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { UserConfig } from "vite";
import { version as reactVersion } from "react";

const viteConfig: UserConfig = {
  plugins: [react(), tsconfigPaths() /*, IstanbulPlugin()*/],
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
    "process.env.LAYOUT_BASE_URL": `"http://127.0.0.1:8081/api"`,
  },
  resolve: {
    alias: {
      "cypress/react18": reactVersion.startsWith("18")
        ? "cypress/react18"
        : "cypress/react",
    },
  },
};
// if (isCI) {
//   viteConfig = mergeConfig(viteConfig, {
//     resolve: {
//       alias: {
//         "@salt-ds/core": path.resolve(__dirname, "./dist/salt-ds-core"),
//         "@salt-ds/data-grid": path.resolve(
//           __dirname,
//           "./dist/salt-ds-data-grid"
//         ),
//         "@salt-ds/lab": path.resolve(__dirname, "./dist/salt-ds-lab"),
//         "@salt-ds/icons": path.resolve(__dirname, "./dist/salt-ds-icons"),
//       },
//     },
//     optimizeDeps: {
//       include: [
//         "@salt-ds/core",
//         "@salt-ds/data-grid",
//         "@salt-ds/lab",
//         "@salt-ds/icons",
//       ],
//     },
//   } as UserConfig);
// }

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 1024,
  video: false,
  component: {
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

  e2e: {
    baseUrl: "http://127.0.0.1:5173/",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
  },
});
