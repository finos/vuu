import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import type {
  LoadedPortalBuildConfig,
  PortalBuildMode,
  PortalBuildPlan,
} from "./config.js";
import { loadPortalBuildConfig, createPortalBuildPlan } from "./config.js";
import { pluginCssInline } from "./css-inline-plugin.js";

export interface BuildPortalOptions {
  configPath?: string;
  loadedConfig?: LoadedPortalBuildConfig;
  mode?: PortalBuildMode;
  rsdoctor?: boolean;
}

/**
 * `serve` config for a remote module's output folder: allow cross-origin
 * loads from the host, have browsers revalidate every file (index.html,
 * mf-manifest.json and config.json keep their names across builds), and
 * fall back to index.html for standalone routes.
 */
export const defaultRemoteServeConfig = {
  headers: [
    {
      source: "**",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cache-Control", value: "no-cache" },
      ],
    },
  ],
  rewrites: [
    { source: "/", destination: "/index.html" },
    { source: "**", destination: "/index.html" },
  ],
};

/** Writes the default serve.json unless the app supplied one in public/. */
const writeDefaultServeConfig = (outputRoot: string) => {
  const serveConfigPath = path.join(outputRoot, "serve.json");
  if (!existsSync(serveConfigPath)) {
    writeFileSync(
      serveConfigPath,
      `${JSON.stringify(defaultRemoteServeConfig, null, 2)}\n`,
    );
  }
};

const resolveExposeRequest = (request: string, root: string): string => {
  if (
    request.startsWith("./") ||
    request.startsWith("../") ||
    request.startsWith("src/")
  ) {
    return path.resolve(root, request);
  }
  return request;
};

export const buildPortal = async ({
  configPath = "portal-build.json",
  loadedConfig: providedConfig,
  mode = "remote",
  rsdoctor = false,
}: BuildPortalOptions = {}) => {
  const loadedConfig =
    providedConfig ?? loadPortalBuildConfig(configPath);
  const plan = createPortalBuildPlan(loadedConfig, mode);
  const config = loadedConfig.config;
  const shared = plan.moduleFederation.shared;
  const federationConfig: Record<string, unknown> =
    plan.target === "remote-module"
      ? {
          name: plan.moduleFederation.name,
          // The remote entry keeps its name: module registries reference it
          // by URL. Only the chunks it loads are hashed.
          filename: `${plan.moduleFederation.name}.js`,
          dts: plan.dts,
          exposes: Object.fromEntries(
            Object.entries(plan.exposes ?? {}).map(([name, request]) => [
              name,
              resolveExposeRequest(request, plan.root),
            ]),
          ),
          shared,
        }
      : {
          name: plan.moduleFederation.name,
          remoteType: plan.moduleFederation.remoteType ?? "module",
          shared,
          ...(plan.moduleFederation.remotes
            ? { remotes: plan.moduleFederation.remotes }
            : {}),
        };

  const rspackPlugins = [
    rsdoctor ? new RsdoctorRspackPlugin({}) : undefined,
    new ModuleFederationPlugin(federationConfig),
  ].filter(Boolean);

  const rsbuild = await createRsbuild({
    cwd: plan.root,
    config:
      plan.target === "remote-module"
        ? {
            source: {
              define: {
                "process.env": JSON.stringify({
                  NODE_ENV: process.env.NODE_ENV || "development",
                }),
              },
              entry: {
                index: plan.entry,
              },
            },
            html: {
              template: plan.htmlTemplate,
              ...(plan.htmlTitle ? { title: plan.htmlTitle } : {}),
            },
            output: {
              assetPrefix: plan.assetPrefix,
              // Old chunks are removed, not left beside the new ones.
              cleanDistPath: true,
              distPath: {
                root: plan.outputRoot,
                css: "./",
                js: "./",
              },
              // Content hashes in chunk names, so a browser never reuses a stale
              // chunk from an earlier build.
              filenameHash: true,
              minify: false,
              manifest: {
                filename: plan.manifest.filename,
                generate: () => plan.manifest.value,
              },
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
            plugins: [
              ...(config.cssInline === false
                ? []
                : [
                    pluginCssInline(
                      typeof config.cssInline === "object"
                        ? config.cssInline
                        : {},
                    ),
                  ]),
              pluginReact(),
            ],
            ...(plan.corsOrigins
              ? { server: { cors: { origin: plan.corsOrigins } } }
              : {}),
            tools: {
              rspack: {
                output: {
                  chunkFormat: "array-push",
                  chunkLoading: "jsonp",
                  publicPath: plan.publicPath,
                },
                plugins: [
                  rsdoctor ? new RsdoctorRspackPlugin({}) : undefined,
                  new ModuleFederationPlugin(federationConfig),
                ].filter(Boolean),
              },
            },
          }
        : plan.target === "application"
          ? {
              html: {
                template: plan.htmlTemplate,
                ...(plan.htmlTitle ? { title: plan.htmlTitle } : {}),
              },
              output: {
                assetPrefix: plan.assetPrefix,
                // Old chunks are removed, not left beside the new ones.
                cleanDistPath: true,
                distPath: {
                  root: plan.outputRoot,
                  css: "./",
                  js: "./",
                },
                // Content hashes in chunk names, so a browser never reuses a stale
                // chunk from an earlier build.
                filenameHash: true,
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
              plugins: [
                ...(config.cssInline === false
                  ? []
                  : [
                      pluginCssInline(
                        typeof config.cssInline === "object"
                          ? config.cssInline
                          : {},
                      ),
                    ]),
                pluginReact(),
              ],
              source: {
                entry: {
                  index: plan.entry,
                },
                ...(plan.preEntry ? { preEntry: plan.preEntry } : {}),
              },
              tools: {
                rspack: {
                  output: {
                    chunkFormat: "module",
                    chunkLoading: "import",
                    library: {
                      type: "module",
                    },
                  },
                  plugins: rsdoctor
                    ? [new RsdoctorRspackPlugin({})]
                    : undefined,
                },
              },
            }
        : {
      html: {
        template: plan.htmlTemplate,
      },
      output: {
        assetPrefix: plan.assetPrefix,
        // Old chunks are removed, not left beside the new ones.
        cleanDistPath: true,
        distPath: {
          root: plan.outputRoot,
          css: "./",
          js: "./",
        },
        // Content hashes in chunk names, so a browser never reuses a stale
        // chunk from an earlier build.
        filenameHash: true,
        minify: false,
        module: true,
        sourceMap: {
          js: "cheap-module-source-map",
          css: true,
        },
        manifest: {
          filename: plan.manifest.filename,
          generate: () => plan.manifest.value,
        },
        target: "web",
      },
      performance: {
        chunkSplit: {
          strategy: "all-in-one",
        },
      },
      plugins: [
        pluginReact(),
        ...(config.cssInline === false
          ? []
          : [
              pluginCssInline(
                typeof config.cssInline === "object" ? config.cssInline : {},
              ),
            ]),
      ],
      source: {
        entry: {
          index: plan.entry,
        },
        ...(plan.preEntry ? { preEntry: plan.preEntry } : {}),
      },
      tools: {
        rspack: {
          output: {
            chunkFormat: "module",
            chunkLoading: "import",
            library: {
              type: "module",
            },
          },
          plugins: rspackPlugins,
        },
      },
    },
  });

  await rsbuild.build();

  if (plan.target === "remote-module") {
    writeDefaultServeConfig(plan.outputRoot);
  }
};
