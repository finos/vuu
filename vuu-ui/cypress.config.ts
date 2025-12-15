import { defineConfig } from "cypress";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { version as reactVersion } from "react";
import { createFilter } from "vite";
import MagicString from "magic-string";

export function cssInline() {
  const exclude = ["**/**.stories.tsx"];
  const include = [
    "**/packages/grid-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-context-menu/**/*.{tsx,jsx}",
    "**/packages/vuu-datatable/**/*.{tsx,jsx}",
    "**/packages/vuu-data-react/**/*.{tsx,jsx}",
    "**/packages/vuu-filters/**/*.{tsx,jsx}",
    "**/packages/vuu-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-notifications/**/*.{tsx,jsx}",
    "**/packages/vuu-popups/**/*.{tsx,jsx}",
    "**/packages/vuu-shell/**/*.{tsx,jsx}",
    "**/packages/vuu-table/**/*.{tsx,jsx}",
    "**/packages/vuu-table-extras/**/*.{tsx,jsx}",
    "**/packages/vuu-ui-controls/**/*.{tsx,jsx}",
  ];

  const filter = createFilter(include, exclude);

  return {
    name: "vite-plugin-inline-css",
    enforce: "pre",
    transform(src, id) {
      if (filter(id)) {
        const s = new MagicString(src);
        s.replaceAll('.css";', '.css?inline";');
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id }),
        };
      }
    },
  };
}

const viteConfig = {
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
  // resolve: {
  //   alias: {
  //     "cypress/react18": reactVersion.startsWith("18")
  //       ? "cypress/react18"
  //       : "cypress/react",
  //   },
  // },
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
        log(message) {
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
