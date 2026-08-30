import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginCssInline } from "../../../tools/rsbuild-plugin-inline-css/src/index.js";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { getCommandLineArg } from "../../../scripts/utils.ts";
import { getSharedDependencies } from "../../../scripts/module-federation-utils.ts";

const useRsDoctor = getCommandLineArg("--rsdoctor", false) !== undefined;

const buildManifest = () => {
  return {
    ssl: true,
    authUrl: "https://localhost:8080",
    restUrl: "https://localhost:8443/api/authn",
    websocketUrl: "wss://localhost:8091/websocket",
  };
};

async function main() {
  const rsbuild = await createRsbuild({
    config: {
      html: {
        template: "./public/index.html",
      },

      output: {
        distPath: {
          root: "../../dist_portal/portal-host",
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
        manifest: {
          filename: "./config.json",
          generate: () => buildManifest(),
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
          plugins: [
            useRsDoctor &&
            new RsdoctorRspackPlugin({
              // plugin options
            }),
            new ModuleFederationPlugin({
              name: "host",
              remoteType: "module",
              shared: getSharedDependencies("consumer"),
            }),
          ],
        },
      },
    },
  });

  await rsbuild.build();
}

await main();
