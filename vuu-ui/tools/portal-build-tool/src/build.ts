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
              distPath: {
                root: plan.outputRoot,
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
                distPath: {
                  root: plan.outputRoot,
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
        distPath: {
          root: plan.outputRoot,
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
};
