import { createRsbuild, rspack, type RsbuildConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import path from "path";
import { parseArgs } from "util";
import { buildFileList } from "./build-file-list";
import { mdxOptions } from "./mdx-options";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";
import { createFolder, writeFile } from "./utils";

/**
 * Production build of the Showcase, using rsbuild. Run from the showcase folder.
 *
 * Exhibits (examples and mdx documents) and features are loaded at runtime,
 * by path. Rather than emit one module per source file, at a predictable url,
 * we generate an entry module that maps each path to a lazy `import()`.
 * This allows rspack to bundle and code split everything normally.
 */

const { values: args } = parseArgs({
  options: {
    "build-only": { type: "boolean", default: false },
  },
});

const pathToExhibits = "./src/examples";
const pathToFeatures = "./src/features";
const showcaseDir = process.cwd();
const srcDir = path.resolve(showcaseDir, ".showcase/prod-src");
const outDir = path.resolve(showcaseDir, ".showcase/prod");
const showcaseRoot = path.resolve(import.meta.dirname, "../src/root.ts");

// Components in these packages inject their own css, using salt
// useComponentCssInjection. Their css must be imported as a string.
const inlineCssPackages =
  /[\\/]packages[\\/](grid-layout|vuu-chart|vuu-context-menu|vuu-datatable|vuu-data-react|vuu-filters|vuu-layout|vuu-notifications|vuu-popups|vuu-shell|vuu-table|vuu-table-extras|vuu-ui-controls)[\\/]/;

const collectExhibitPaths = (
  treeSourceNodes: TreeSourceNode[],
  paths = new Set<string>(),
) => {
  for (const { childNodes, nodeData } of treeSourceNodes) {
    const exhibitPath = (nodeData as { path?: string } | undefined)?.path;
    if (exhibitPath) {
      paths.add(exhibitPath);
    }
    if (childNodes) {
      collectExhibitPaths(childNodes, paths);
    }
  }
  return paths;
};

const importPath = (filePath: string) =>
  path
    .relative(srcDir, path.resolve(showcaseDir, filePath))
    .split(path.sep)
    .join("/");

const lazyImport = (filePath: string) =>
  `() => import(${JSON.stringify(importPath(filePath))})`;

const createEntryModule = (exhibitPaths: Set<string>) => {
  const exhibits = Array.from(exhibitPaths)
    .sort()
    .map((p) => `  ${JSON.stringify(p)}: ${lazyImport(p)},`)
    .join("\n");

  // Feature urls, as used by the examples in production, e.g
  // /features/FilterTable.feature.js
  const features = buildFileList(pathToFeatures, /\.feature\.tsx$/)
    .map((p) => {
      const url = `/features/${path.basename(p).replace(/\.tsx$/, ".js")}`;
      return `  ${JSON.stringify(url)}: ${lazyImport(p)},`;
    })
    .join("\n");

  return `import { importFeatureByUrl, setFeatureImporter } from "@vuu-ui/vuu-utils";
import start from ${JSON.stringify(importPath(showcaseRoot))};
import treeSource from "./treeSourceJson.js";

const exhibits = {
${exhibits}
};

const features = {
${features}
};

setFeatureImporter((url) => features[url]?.() ?? importFeatureByUrl(url));

start(treeSource, (exhibitPath) => {
  const importExhibit = exhibits[exhibitPath];
  return importExhibit
    ? importExhibit()
    : Promise.reject(new Error(\`No Showcase module for \${exhibitPath}\`));
});
`;
};

const rsbuildConfig: RsbuildConfig = {
  mode: "production",
  plugins: [pluginReact()],
  source: {
    entry: { index: path.join(srcDir, "index.js") },
    define: {
      "process.env.NODE_DEBUG": false,
    },
  },
  html: {
    title: "Vuu Showcase",
  },
  output: {
    distPath: { root: outDir },
    cleanDistPath: true,
    sourceMap: { js: "source-map" },
    minify: {
      // vuu-layout identifies components by function name (typeOf)
      jsOptions: {
        minimizerOptions: {
          compress: { keep_classnames: true, keep_fnames: true },
          mangle: { keep_classnames: true, keep_fnames: true },
        },
      },
    },
  },
  performance: {
    printFileSize: false,
  },
  server: {
    port: 4173,
    strictPort: true,
    // Showcase routes are client side routes, all are served index.html
    historyApiFallback: true,
    proxy: {
      "/api/authn": {
        target: "https://localhost:8443",
        changeOrigin: true,
        // Local auth services often use self-signed certs.
        secure: false,
      },
    },
  },
  tools: {
    rspack: (config, { appendPlugins, addRules }) => {
      addRules({
        test: /\.mdx$/,
        use: [{ loader: "@mdx-js/loader", options: mdxOptions }],
      });
      appendPlugins(
        new rspack.NormalModuleReplacementPlugin(/\.css$/, (resource) => {
          if (inlineCssPackages.test(resource.context ?? "")) {
            resource.request = `${resource.request}?inline`;
          }
        }),
      );
      // Several packages declare "sideEffects": false but still register
      // components (e.g. vuu-layout containers) via module side effects.
      config.optimization = { ...config.optimization, sideEffects: false };
      return config;
    },
  },
};

async function main() {
  const [treeSourceJson] = treeSourceFromFileSystem(pathToExhibits);

  createFolder(srcDir);
  await writeFile(
    `export default ${JSON.stringify(treeSourceJson)};`,
    path.join(srcDir, "treeSourceJson.js"),
  );
  await writeFile(
    createEntryModule(collectExhibitPaths(treeSourceJson)),
    path.join(srcDir, "index.js"),
  );

  const rsbuild = await createRsbuild({
    cwd: showcaseDir,
    rsbuildConfig,
  });

  const start = performance.now();
  try {
    const { close } = await rsbuild.build();
    await close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  console.log(
    `\nbuild took ${((performance.now() - start) / 1000).toFixed(1)}s`,
  );

  if (!args["build-only"]) {
    await rsbuild.preview();
  }
}

main();
