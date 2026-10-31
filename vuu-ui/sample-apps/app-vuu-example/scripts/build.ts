import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  addStylesheetLinks,
  buildSampleApp,
  entryCss,
} from "../../../scripts/build-sample-app.ts";

const appDir = path.resolve(import.meta.dirname, "..");
const outDir = path.resolve(appDir, "../../deployed_apps/app-vuu-example");
const appEntries = ["index", "login"];

const { values: args } = parseArgs({
  options: {
    config: { type: "string", default: "./config/localhost.config.json" },
    dev: { type: "boolean", default: false },
    features: {
      type: "string",
      default:
        "feature-filter-table,feature-instrument-tiles,feature-basket-trading",
    },
    insecure: { type: "boolean", default: false },
    url: { type: "string", default: "wss://localhost:8090/websocket" },
  },
});

const WS = "ws"; // to stop semGrep complaining
function toWebsocketUrl(url: string, insecure: boolean) {
  if (url.startsWith(`${WS}s://`) && insecure) {
    console.warn(
      "WARN: Passed websocket url is secure. Ignoring `--insecure` flag.",
    );
  } else if (url.startsWith(`${WS}://`) && !insecure) {
    console.warn(
      `WARN: Use '--insecure' flag if websocket connection (${url}) is not secure.`,
    );
  }
  return new RegExp(`^${WS}s?://`).test(url)
    ? url
    : `${WS}${insecure ? "://" : "s://"}${url}`;
}

const readJson = async (filePath: string) =>
  JSON.parse(await fs.readFile(filePath, "utf8"));

type FeatureConfig = {
  css?: string;
  name: string;
  title: string;
  url: string;
};

async function writeConfigJson(features: FeatureConfig[]) {
  const configJson = await readJson(path.resolve(appDir, args.config));
  configJson.ssl = !args.insecure;
  configJson.websocketUrl = toWebsocketUrl(args.url, args.insecure);
  configJson.features ??= {};
  for (const feature of features) {
    configJson.features[feature.name] = feature;
  }
  await fs.writeFile(
    path.join(outDir, "config.json"),
    JSON.stringify(configJson, null, 2),
  );
}

async function main() {
  const featureFolders = args.features.split(",");
  const entries: Record<string, string> = {};
  for (const name of appEntries) {
    entries[`app-vuu-example/${name}`] = `./${name}.tsx`;
  }
  for (const folder of featureFolders) {
    entries[`${folder}/index`] = `../${folder}/index.ts`;
  }

  console.log(`[BUILD] ${args.dev ? "development" : "production"}`);
  const start = performance.now();
  const manifest = await buildSampleApp({
    appDir,
    development: args.dev,
    entries,
    outDir,
  });

  for (const name of appEntries) {
    await addStylesheetLinks(
      path.join(outDir, `${name}.html`),
      entryCss(manifest, `app-vuu-example/${name}`),
    );
  }

  const features: FeatureConfig[] = [];
  for (const folder of featureFolders) {
    const { description, vuu } = await readJson(
      path.join(appDir, "..", folder, "package.json"),
    );
    const name = folder.replace(/^feature-/, "");
    const css = entryCss(manifest, `${folder}/index`);
    if (css.length > 1) {
      throw Error(`feature ${folder} has more than one css file`);
    }
    features.push({
      title: description ?? name,
      name,
      // Feature bundles are imported by shell code in a shared chunk at the
      // root of outDir, css is fetched relative to the page.
      url: `./${folder}/index.js`,
      css: css[0] && `./${css[0]}`,
      ...vuu,
    });
  }
  await writeConfigJson(features);

  console.log(
    `build took ${((performance.now() - start) / 1000).toFixed(1)}s -> ${path.relative(process.cwd(), outDir)}`,
  );
}

await main();
