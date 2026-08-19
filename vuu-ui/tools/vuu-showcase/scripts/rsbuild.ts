import { createRequire } from "node:module";
import path from "node:path";
import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import { BannerPlugin } from "@rspack/core";
import { pluginCssInline } from "../../rsbuild-plugin-inline-css/src/index.js";
import { discoverShowcaseExamples } from "./showcase-examples.ts";

const require = createRequire(import.meta.url);
const uiDirectory = path.resolve(import.meta.dirname, "../../..");
const showcaseDirectory = path.resolve(uiDirectory, "showcase");
const examplesDirectory = path.join(showcaseDirectory, "src/examples");
const featuresDirectory = path.join(showcaseDirectory, "src/features");
const remotePath = "/showcase-examples/";

const sharedPackages = [
  "@heswell/grid-layout",
  "@salt-ds/core",
  "@salt-ds/theme",
  "@vuu-ui/core",
  "@vuu-ui/vuu-data-editing",
  "@vuu-ui/vuu-data-react",
  "@vuu-ui/vuu-data-test",
  "@vuu-ui/vuu-datatable",
  "@vuu-ui/vuu-icons",
  "@vuu-ui/vuu-layout",
  "@vuu-ui/vuu-notifications",
  "@vuu-ui/vuu-shell",
  "@vuu-ui/vuu-theme",
  "@vuu-ui/vuu-ui-controls",
  "@vuu-ui/vuu-utils",
  "clsx",
  "react",
  "react-dom",
  "react-router-dom",
] as const;

const getShowcaseSharedDependencies = (role: "host" | "remote") =>
  Object.fromEntries([
    ...sharedPackages.map((packageName) => [
      packageName,
      {
        eager: role === "host",
        import: role === "remote" ? false : undefined,
        requiredVersion: false,
        singleton: true,
      },
    ]),
  ]);

const output = (directory: string, assetPrefix: string, development: boolean) => ({
  assetPrefix,
  cleanDistPath: development ? false : undefined,
  distPath: {
    css: "./",
    js: "./",
    root: directory,
  },
  filenameHash: !development,
  minify: !development,
  module: true,
  sourceMap: {
    css: true,
    js: "cheap-module-source-map" as const,
  },
  target: "web" as const,
});

const moduleOutput = (publicPath: string) => ({
  chunkFormat: "module",
  chunkLoading: "import",
  library: { type: "module" },
  publicPath,
});

export const createShowcaseRsbuilds = async (
  development: boolean,
  outputDirectory: string,
) => {
  const { exposes, treeSource } = discoverShowcaseExamples(examplesDirectory);
  const featureExposes = Object.fromEntries(
    ["BasketTrading", "FilterTable", "InstrumentTiles"].map((featureName) => [
      `./features/${featureName}`,
      path.join(featuresDirectory, `${featureName}.feature.tsx`),
    ]),
  );
  const host = await createRsbuild({
    config: {
      html: {
        template: path.join(uiDirectory, "tools/vuu-showcase/public/index.html"),
      },
      output: {
        ...output(outputDirectory, "/", development),
        cleanDistPath: true,
      },
      plugins: [pluginReact(), pluginCssInline()],
      root: uiDirectory,
      server: {
        port: 5173,
        publicDir: {
          copyOnBuild: false,
          name: outputDirectory,
          watch: true,
        },
        proxy: {
          "/api/authn": {
            secure: false,
            target: "https://localhost:8443",
          },
        },
      },
      source: {
        define: {
          __SHOWCASE_TREE_SOURCE__: JSON.stringify(treeSource),
          "process.env.NODE_DEBUG": "false",
        },
        entry: {
          index: path.join(uiDirectory, "tools/vuu-showcase/src/showcase-app.ts"),
        },
      },
      tools: {
        rspack: {
          output: moduleOutput("/"),
          plugins: [
            new BannerPlugin({
              banner:
                "var __name = globalThis.__name ?? ((target) => target); globalThis.__name = __name;",
              entryOnly: true,
              raw: true,
            }),
            new ModuleFederationPlugin({
              dts: false,
              name: "showcase_host",
              remoteType: "module",
              shared: getShowcaseSharedDependencies("host"),
            }),
          ],
        },
      },
    },
  });
  const remote = await createRsbuild({
    config: {
      output: {
        ...output(path.join(outputDirectory, "showcase-examples"), remotePath, development),
        cleanDistPath: false,
        module: false,
      },
      plugins: [pluginReact(), pluginCssInline()],
      root: uiDirectory,
      dev: {
        hmr: false,
      },
      source: {
        entry: {
          index: path.join(
            uiDirectory,
            "tools/vuu-showcase/src/showcase-remote.ts",
          ),
        },
      },
      tools: {
        rspack: {
          module: {
            rules: [
              {
                test: /\.mdx$/,
                use: [
                  {
                    loader: require.resolve("@mdx-js/loader"),
                  },
                ],
              },
            ],
          },
          output: {
            chunkFormat: "array-push",
            chunkLoading: "jsonp",
            publicPath: remotePath,
          },
          plugins: [
            new BannerPlugin({
              banner:
                "var __name = globalThis.__name ?? ((target) => target); globalThis.__name = __name;",
              entryOnly: true,
              raw: true,
            }),
            new ModuleFederationPlugin({
              dts: false,
              exposes: { ...exposes, ...featureExposes },
              name: "showcase_examples",
              shared: getShowcaseSharedDependencies("remote"),
            }),
          ],
        },
      },
    },
  });

  return { host, remote };
};
