import { createRequire } from "node:module";
import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginCssInline } from "../tools/rsbuild-plugin-inline-css/src/index.js";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { getCommandLineArg } from "./utils.ts";
import { getSharedDependencies } from "./module-federation-utils.ts";
import path from "path";
const useRsDoctor = getCommandLineArg("--rsdoctor", false) !== undefined;

const packageJsonPath = path.resolve(process.cwd(), "./package.json");
const require = createRequire(import.meta.url);
const packageJson = require(packageJsonPath);

const normalizeExposes = (exposes: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(exposes).map(([name, request]) => [
      name,
      request.startsWith("src/") ? `./${request}` : request,
    ]),
  );

async function build(
  packageName: string,
  {
    port,
    name,
    exposes,
  }: {
    exposes: Record<string, string>;
    name: string;
    port: number;
  },
) {
  console.log(
    `build remote module for provider ${packageName}, provides ${name} on port ${port}`,
  );

  const rsbuild = await createRsbuild({
    config: {
      source: {
        define: {
          "process.env": JSON.stringify({
            NODE_ENV: process.env.NODE_ENV || "development",
          }),
        },
      },
      html: {
        template: "../remote-module-template/index.html",
        title: `${name} (standalone)`,
      },
      output: {
        distPath: {
          root: `../../deployed_apps/${packageName}`,
          css: "./",
          js: "./",
        },
        filenameHash: false,
        minify: false,
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
      plugins: [pluginCssInline(), pluginReact()],

      server: {
        cors: {
          origin: ["http://localhost:5002"],
        },
      },

      tools: {
        rspack: {
          output: {
            chunkFormat: "array-push",
            chunkLoading: "jsonp",
            publicPath: `http://localhost:${port}/`,
          },
          plugins: [
            useRsDoctor &&
              new RsdoctorRspackPlugin({
                // plugin options
              }),
            new ModuleFederationPlugin({
              name,
              dts: false,
              exposes: normalizeExposes(exposes),
              shared: getSharedDependencies("producer"),
            }),
          ],
        },
      },
    },
  });

  await rsbuild.build();
}

const {
  name,
  vuu: { ["module-federation"]: moduleFederationProps },
} = packageJson;

await build(name, moduleFederationProps);
