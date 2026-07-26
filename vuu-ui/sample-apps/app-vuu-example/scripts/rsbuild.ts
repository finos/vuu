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
    authUrl: "http://localhost:5001",
    restUrl: "https://localhost:8443",
    websocketUrl: "wss://localhost:8090/websocket",
    features: {
      "simple-div": {
        title: "Vuu Simple Div",
        mfComponent: "SimpleDiv",
        mfScope: "simpleDiv",
        mfUrl: "http://localhost:5004",
        leftNavLocation: "vuu-features",
      },
      "filter-table": {
        title: "Vuu Filter Table",
        mfComponent: "VuuFilterTableFeature",
        mfScope: "filterTable",
        mfUrl: "http://localhost:5003",
        featureProps: {
          vuuTables: "*",
        },
      },
      "user-admin": {
        title: "Vuu User Admin",
        mfComponent: "UserAdmin",
        mfScope: "userAdmin",
        mfUrl: "http://localhost:5007",
        leftNavLocation: "vuu-features",
      },
      "instrument-tiles": {
        title: "Instrument Price Tiles",
        mfComponent: "VuuInstrumentTilesFeature",
        mfScope: "instrumentTiles",
        mfUrl: "http://localhost:5006",
        featureProps: {
          vuuTables: [
            {
              module: "SIMUL",
              table: "instrumentPrices",
            },
          ],
        },
        leftNavLocation: "vuu-features",
      },
      "basket-trading": {
        title: "Basket Trading",
        mfComponent: "VuuBasketTradingFeature",
        mfScope: "basketTrading",
        mfUrl: "http://localhost:5005",
        viewProps: {
          header: false,
        },
        featureProps: {
          vuuTables: [
            {
              module: "BASKET",
              table: "basket",
            },
            {
              module: "BASKET",
              table: "basketTrading",
            },
            {
              module: "BASKET",
              table: "basketTradingConstituentJoin",
            },
            {
              module: "BASKET",
              table: "basketConstituent",
            },
          ],
        },
        leftNavLocation: "vuu-features",
      },
    },
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
          root: "../../deployed_apps/app-vuu-example",
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
