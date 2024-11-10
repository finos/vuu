import {
  createFolder,
  byFileName,
  formatBytes,
  formatDuration,
  padRight,
  readPackageJson,
} from "../../../scripts/utils.mjs";
import { build } from "../../../scripts/esbuild.mjs";

// TODO use a separate build call for each theme, without bundling
// const themes = ["./src/themes/salt-theme.ts", "./src/themes/vuu-theme.ts"];

const entryPoints = ["showcase-ui/main.ts"];

const outdir = "dist";

const { name: projectName } = readPackageJson();

const esbuildConfig = {
  entryPoints,
  env: "production",
  name: "showcase",
  outdir,
  splitting: false,
  target: "esnext",
};

async function main() {
  console.log("[CLEAN]");
  // Create the deploy folder
  createFolder(outdir);

  console.log("[BUILD]");
  const [
    {
      result: { metafile },
      duration,
    },
  ] = await Promise.all([build(esbuildConfig)]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  const outputs = {
    core: [],
    common: [],
    features: [],
  };
  for (const [file, { bytes }] of Object.entries(metafile.outputs)) {
    if (file.endsWith("js") || file.endsWith("css")) {
      const fileName = file.replace(`${outdir}/`, "");
      if (fileName.startsWith(projectName)) {
        outputs.core.push({ fileName, bytes });
      } else {
        outputs.common.push({ fileName, bytes });
      }
    }
  }

  console.log("\ncore");
  outputs.core.sort(byFileName).forEach(({ fileName, bytes }) => {
    console.log(`${padRight(fileName, 30)} ${formatBytes(bytes)}`);
  });
  console.log("\ncommon");
  outputs.common.forEach(({ fileName, bytes }) => {
    console.log(`${padRight(fileName, 30)} ${formatBytes(bytes)}`);
  });

  console.log(`\nbuild took ${formatDuration(duration)}`);
}

main();
