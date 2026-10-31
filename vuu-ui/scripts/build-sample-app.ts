import { createRsbuild, rspack } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import fs from "node:fs/promises";
import path from "node:path";

// Components in these packages inject their own css, using salt
// useComponentCssInjection. Their css must be imported as a string.
const inlineCssPackages =
  /[\\/]packages[\\/](grid-layout|vuu-chart|vuu-context-menu|vuu-datatable|vuu-data-react|vuu-filters|vuu-layout|vuu-notifications|vuu-popups|vuu-shell|vuu-table|vuu-table-extras|vuu-ui-controls)[\\/]/;

const MANIFEST_FILE = "rsbuild-manifest.json";

type ManifestEntry = {
  initial?: { js?: string[]; css?: string[] };
  async?: { js?: string[]; css?: string[] };
};

export type BuildManifest = {
  allFiles: string[];
  entries: Record<string, ManifestEntry>;
};

export interface SampleAppBuildOptions {
  /** folder of the sample app, holds the public folder */
  appDir: string;
  development: boolean;
  /** entry name (output path without extension) => source path relative to appDir */
  entries: Record<string, string>;
  outDir: string;
}

/**
 * Builds a sample app as native ES modules, one output file per entry.
 * Entries share a single runtime and common chunks, so a feature bundle
 * loaded at runtime with import(url) uses the same React and vuu module
 * instances as the app that loads it.
 */
export async function buildSampleApp({
  appDir,
  development,
  entries,
  outDir,
}: SampleAppBuildOptions): Promise<BuildManifest> {
  const rsbuild = await createRsbuild({
    cwd: appDir,
    config: {
      mode: development ? "development" : "production",
      plugins: [pluginReact()],
      source: {
        entry: entries,
        define: {
          "process.env.NODE_DEBUG": false,
        },
      },
      output: {
        cleanDistPath: true,
        distPath: { root: outDir, js: "", css: "" },
        filenameHash: false,
        manifest: MANIFEST_FILE,
        minify: development
          ? false
          : {
              // vuu-layout identifies components by function name (typeOf)
              jsOptions: {
                minimizerOptions: {
                  compress: { keep_classnames: true, keep_fnames: true },
                  mangle: { keep_classnames: true, keep_fnames: true },
                },
              },
            },
        module: true,
        sourceMap: { js: "source-map", css: true },
      },
      performance: {
        printFileSize: false,
      },
      tools: {
        htmlPlugin: false,
        rspack: (config, { appendPlugins }) => {
          appendPlugins(
            new rspack.NormalModuleReplacementPlugin(/\.css$/, (resource) => {
              if (inlineCssPackages.test(resource.context ?? "")) {
                resource.request = `${resource.request}?inline`;
              }
            }),
          );
          config.optimization = {
            ...config.optimization,
            // One runtime for all entries, so feature bundles share
            // module instances with the app.
            runtimeChunk: "single",
            // Several packages declare "sideEffects": false but still register
            // components (e.g. vuu-layout containers) via module side effects.
            sideEffects: false,
          };
          // Feature bundles are loaded with import(url) and must expose their
          // default export as an ES module export.
          config.output = {
            ...config.output,
            library: { type: "module" },
          };
          return config;
        },
      },
    },
  });

  const { close } = await rsbuild.build();
  await close();

  const manifestPath = path.join(outDir, MANIFEST_FILE);
  const manifest = JSON.parse(
    await fs.readFile(manifestPath, "utf8"),
  ) as BuildManifest;
  await fs.rm(manifestPath);

  await fs.cp(path.join(appDir, "public"), outDir, {
    recursive: true,
    filter: (source) => path.basename(source) !== ".DS_Store",
  });

  return manifest;
}

/** The css files loaded by an entry, as paths relative to outDir */
export const entryCss = (manifest: BuildManifest, entryName: string) =>
  (manifest.entries[entryName]?.initial?.css ?? []).map((file) =>
    file.replace(/^\//, ""),
  );

/**
 * Adds a stylesheet link for each css file an entry loads. The html
 * pages in public load entry scripts directly, the entry script then
 * imports the runtime and shared chunks it needs.
 */
export async function addStylesheetLinks(
  htmlPath: string,
  stylesheets: string[],
) {
  const html = await fs.readFile(htmlPath, "utf8");
  const links = stylesheets
    .map((href) => `    <link rel="stylesheet" href="${href}" />\n`)
    .join("");
  await fs.writeFile(htmlPath, html.replace("  </head>", `${links}  </head>`));
}
