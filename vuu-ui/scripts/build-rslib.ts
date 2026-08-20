import { createRslib } from "@rslib/core";
import { pluginReact } from "@rsbuild/plugin-react";
import fs from "fs";
import path from "path";
import { copyLicense } from "./copy-license.ts";
import { readPackageJson, writePackageJSON } from "./package-json.ts";

const DIST_PATH = "../../dist";
const LICENCE_PATH = "../../../LICENSE";
const README = "README.md";

function rewriteCssFiles(cssFiles: string[], outDir: string) {
  return Promise.all(
    cssFiles.map(async (cssFile) => {
      const outPath = path.resolve(outDir, cssFile);
      await fs.promises.rename(outPath, `${outPath}.js`);
    }),
  );
}

export default async function main() {
  const packageJson = readPackageJson();
  const { name: scopedPackageName } = packageJson;
  const [, packageName] = scopedPackageName.split("/");
  const outPath = `${DIST_PATH}/${packageName}`;
  const outPathSrc = `${outPath}/src`;

  const rslib = await createRslib({
    config: {
      lib: [
        {
          banner: { css: "const css = `" },
          bundle: false,
          dts: false,
          footer: { css: "`;\nexport default css;" },
          format: "esm",
          output: {
            cleanDistPath: true,
            distPath: { root: outPathSrc },
          },
          source: {
            entry: {
              index: [
                "index.ts",
                "src/**/*.ts?(x)",
                "src/**/*.css",
                "!src/__tests__/**/*",
              ],
            },
          },
        },
      ],
      output: { target: "web" },
      plugins: [pluginReact()],
    },
  });

  const { stats } = await rslib.build();
  if (!stats) return;

  const { assets } = stats.toJson({
    all: false,
    assets: true,
  });
  const cssFiles =
    assets?.flatMap(({ name }) => (name.endsWith(".css") ? [name] : [])) ?? [];

  await rewriteCssFiles(cssFiles, outPathSrc);
  await writePackageJSON(packageJson, outPath, README);
  await copyLicense(LICENCE_PATH, outPath);
}
