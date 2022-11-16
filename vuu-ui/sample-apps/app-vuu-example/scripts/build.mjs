import { formatBytes, formatDuration } from "../../../scripts/utils.mjs";
import { build } from "../../../scripts/esbuild.mjs";
import fs from "fs";
import path from "path";

const entryPoints = ["src/index.tsx", "src/login.tsx"];

const featureEntryPoints = [
  "src/features/filtered-grid/index.ts",
  "src/features/metrics/index.js",
];

const outbase = "src";
const outdir = "../../deployed_apps/app-vuu-example";

const stripOutdir = (file) => file.replace(RegExp(`^${outdir}\/`), "");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const development = watch || args.includes("--dev");

const mainConfig = {
  entryPoints: entryPoints.concat(featureEntryPoints),
  env: development ? "development" : "production",
  name: "app-vuu-example",
  outdir,
  splitting: true,
};

async function main() {
  function createDeployFolder() {
    fs.rmSync(outdir, { recursive: true, force: true });
    fs.mkdirSync(outdir, { recursive: true });
  }

  console.log("[CLEAN]");
  createDeployFolder();

  console.log("[BUILD]");
  const [
    {
      result: { metafile },
      duration,
    },
  ] = await Promise.all([build(mainConfig)]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  console.log("[DEPLOY public assets]");
  const publicContent = fs.readdirSync(`./public`);
  publicContent.forEach((file) => {
    if (file !== ".DS_Store") {
      fs.cp(
        path.resolve("public", file),
        path.resolve(outdir, file),
        { recursive: true },
        (err) => {
          if (err) throw err;
        }
      );
    }
  });

  entryPoints.concat(featureEntryPoints).forEach((fileName) => {
    const outJS = `${outdir}/${fileName
      .replace(new RegExp(`^${outbase}\\/`), "")
      .replace(/x$/, "")
      .replace(/ts$/, "js")}`;
    const outCSS = outJS.replace(/js$/, "css");
    const {
      outputs: { [outJS]: jsOutput, [outCSS]: cssOutput },
    } = metafile;
    console.log(
      `\t${stripOutdir(outJS)}:  ${formatBytes(
        jsOutput.bytes
      )} (${formatDuration(duration)})`
    );
    if (cssOutput) {
      console.log(`\t${stripOutdir(outCSS)}: ${formatBytes(cssOutput.bytes)}`);
    }
  });
}

main();
