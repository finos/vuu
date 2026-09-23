import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import type { PortalBuildMode, PortalBuildPlan } from "./config.js";
import { loadPortalBuildConfig, createPortalBuildPlan } from "./config.js";
import { pluginCssInline } from "./css-inline-plugin.js";

export interface BuildPortalOptions {
  configPath?: string;
  mode?: PortalBuildMode;
  rsdoctor?: boolean;
}

export const buildPortal = async ({
  configPath = "portal-build.json",
  mode = "remote",
  rsdoctor = false,
}: BuildPortalOptions = {}) => {
  const loadedConfig = loadPortalBuildConfig(configPath);
  const plan = createPortalBuildPlan(loadedConfig, mode);
  const config = loadedConfig.config;
  const shared = plan.moduleFederation.shared;
  const federationConfig: Record<string, unknown> = {
    name: plan.moduleFederation.name,
    remoteType: plan.moduleFederation.remoteType ?? "module",
    shared,
  };
  if (plan.moduleFederation.remotes) {
    federationConfig.remotes = plan.moduleFederation.remotes;
  }

  const rspackPlugins = [
    rsdoctor ? new RsdoctorRspackPlugin({}) : undefined,
    new ModuleFederationPlugin(federationConfig),
  ].filter(Boolean);

  const rsbuild = await createRsbuild({
    config: {
      html: {
        template: plan.htmlTemplate,
      },
      output: {
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
