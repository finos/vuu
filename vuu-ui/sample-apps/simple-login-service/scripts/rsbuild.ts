import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginCssInline } from "../../../tools/rsbuild-plugin-inline-css/src/index.js";

async function main() {
  console.log("rsbuild");

  const rsbuild = await createRsbuild({
    config: {
      html: {
        template: "./public/index.html",
      },

      output: {
        distPath: {
          root: "../../deployed_apps/simple-login-service",
          css: "./",
          js: "./",
        },
        filenameHash: false,
        minify: false,
        module: true,
        sourceMap: {
          js: "cheap-module-source-map",
          css: true,
        },
        target: "web",
      },

      performance: {
        chunkSplit: {
          strategy: "all-in-one",
        },
      },
      plugins: [pluginReact(), pluginCssInline()],

      tools: {
        rspack: {
          output: {
            chunkFormat: "module",
            chunkLoading: "import",
            library: {
              type: "module",
            },
          },
        },
      },
    },
  });

  await rsbuild.build();
}

await main();
