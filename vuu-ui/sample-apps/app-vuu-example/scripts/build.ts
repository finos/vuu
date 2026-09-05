import { createRsbuild } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCommandLineArg } from "../../../scripts/utils.ts";
import { pluginCssInline } from "../../../tools/rsbuild-plugin-inline-css/src/index.js";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.resolve(
  appDirectory,
  "../../deployed_apps/app-vuu-example",
);
const defaultFeatures =
  "feature-filter-table,feature-instrument-tiles,feature-basket-trading";

const websocketProtocol = "ws";

function toWebsocketUrl(url: string | undefined, insecure: boolean) {
  if (url === undefined) {
    return undefined;
  }

  if (url.startsWith(`${websocketProtocol}s://`) && insecure) {
    console.warn(
      "WARN: Passed websocket url is secure. Ignoring `--insecure` flag.",
    );
    return url;
  }

  if (url.startsWith(`${websocketProtocol}://`) && !insecure) {
    console.warn(
      `WARN: Use '--insecure' flag if websocket connection (${url}) is not secure.`,
    );
    return url;
  }

  return url.match(new RegExp(`^${websocketProtocol}s?://`))
    ? url
    : `${websocketProtocol}${insecure ? "://" : "s://"}${url}`;
}

function resolveConfigPath(configPath: string | undefined) {
  if (configPath === undefined) {
    return path.join(appDirectory, "config/localhost.config.json");
  }

  return path.isAbsolute(configPath)
    ? configPath
    : path.resolve(appDirectory, configPath);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

type FeaturePackage = {
  description?: string;
  vuu?: Record<string, unknown>;
};

async function writeFeatureEntriesToConfigJson(
  featureEntries: string[],
  configFile: string,
  insecure: boolean,
  websocketUrl: string | undefined,
) {
  const configJson = await readJson<Record<string, unknown>>(configFile);
  const features =
    (configJson.features as
      | Record<string, Record<string, unknown>>
      | undefined) ?? {};

  configJson.ssl = !insecure;
  configJson.authUrl ??= "login.html";
  configJson.restUrl ??= "/api/authn";
  configJson.features = features;
  if (websocketUrl !== undefined) {
    configJson.websocketUrl = websocketUrl;
  }

  await Promise.all(
    featureEntries.map(async (featureEntry) => {
      const featureDirectory = path.join(appDirectory, "..", featureEntry);
      const featureName = featureEntry.replace(/^feature-/, "");
      const packageJson = await readJson<FeaturePackage>(
        path.join(featureDirectory, "package.json"),
      );
      const featureOutputDirectory = path.join(outputDirectory, featureEntry);
      const cssPath = path.join(featureOutputDirectory, "index.css");

      features[featureName] = {
        title: packageJson.description ?? featureName,
        name: featureName,
        url: `../${featureEntry}/index.js`,
        ...((await fileExists(cssPath))
          ? { css: `./${featureEntry}/index.css` }
          : {}),
        ...packageJson.vuu,
      };
    }),
  );

  await writeFile(
    path.join(outputDirectory, "config.json"),
    `${JSON.stringify(configJson, null, 2)}\n`,
  );
}

async function main() {
  const insecure = getCommandLineArg("--insecure") !== undefined;
  const development =
    getCommandLineArg("--watch") !== undefined ||
    getCommandLineArg("--dev") !== undefined;
  const websocketUrl = toWebsocketUrl(
    getCommandLineArg("--url", true, "wss://localhost:8090/websocket"),
    insecure,
  );
  const featureEntries = (
    getCommandLineArg("--features", true, defaultFeatures) ?? defaultFeatures
  ).split(",");
  const configFile = resolveConfigPath(getCommandLineArg("--config", true));

  const sourceEntries = Object.fromEntries([
    ["app-vuu-example/index", "./index.tsx"],
    ["app-vuu-example/login", "./login.tsx"],
    ...featureEntries.map((featureEntry) => [
      `${featureEntry}/index`,
      `../${featureEntry}/index.ts`,
    ]),
  ]);

  const rsbuild = await createRsbuild({
    config: {
      root: appDirectory,
      source: {
        entry: sourceEntries,
        define: {
          "process.env.NODE_ENV": JSON.stringify(
            development ? "development" : "production",
          ),
          "process.env.NODE_DEBUG": "false",
        },
      },
      output: {
        cleanDistPath: true,
        distPath: {
          root: outputDirectory,
          css: "./",
          js: "./",
        },
        filenameHash: false,
        minify: !development,
        sourceMap: true,
        target: "web",
      },
      performance: {
        chunkSplit: {
          strategy: "all-in-one",
        },
      },
      plugins: [
        pluginReact(),
        pluginCssInline({
          include: [
            "/packages/grid-layout/",
            "/packages/vuu-datatable/",
            "/packages/vuu-context-menu/",
            "/packages/vuu-data-react/",
            "/packages/vuu-filters/",
            "/packages/vuu-layout/",
            "/packages/vuu-notifications/",
            "/packages/vuu-popups/",
            "/packages/vuu-shell/",
            "/packages/vuu-chart/",
            "/packages/vuu-table/",
            "/packages/vuu-table-extras/",
            "/packages/vuu-ui-controls/",
            "/sample-apps/app-vuu-example/src/legacy-feature-navigation/",
          ],
        }),
      ],
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
  await Promise.all(
    Object.keys(sourceEntries).map((entryName) =>
      rm(path.join(outputDirectory, `${entryName}.html`), { force: true }),
    ),
  );
  await mkdir(outputDirectory, { recursive: true });
  await cp(path.join(appDirectory, "public"), outputDirectory, {
    force: true,
    recursive: true,
  });
  await writeFeatureEntriesToConfigJson(
    featureEntries,
    configFile,
    insecure,
    websocketUrl,
  );
}

await main();
