import { createRslib } from "@rslib/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";
import fs from "fs";
import { readPackageJson, writePackageJSON } from "./package-json.ts";
import { copyLicense } from "./copy-license.ts";
// import { pluginCssInline } from "../tools/rsbuild-plugin-inline-css/src/index.js";
const DIST_PATH = "../../dist";
const LICENCE_PATH = "../../../LICENSE";
const README = "README.md";

function rewriteCssFiles(cssFiles: string[], outDir: string, delay = 1000) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      for (const cssFile of cssFiles) {
        const outPath = path.resolve(outDir, cssFile);
        await fs.rename(outPath, `${outPath}.js`, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
      resolve(void 0);
    }, delay);
  });
}

export default async function main() {
  const packageJson = readPackageJson();
  const { name: scopedPackageName } = packageJson;
  const [, packageName] = scopedPackageName.split("/");
  const outPath = `${DIST_PATH}/${packageName}`;
  const outPathSrc = `${outPath}/src`;

  const cssFiles: string[] = [];

  console.log(`\n${scopedPackageName}`);



  const rslib = await createRslib({
    config: {
      lib: [
        {
          banner: {
            css: "const css = `",
          },
          bundle: false,
          dts: false,
          footer: {
            css: "`;\nexport default css;",
          },
          format: "esm",
          output: {
            cleanDistPath: true,
            distPath: { root: `${outPathSrc}` },
          },
          source: {
            entry: {
              index: ["src/**/*.ts?(x)", "src/**/*.css", "!src/__tests__/**/*"],
            },
          },
        },
      ],
      output: {
        target: "web",
      },
      // plugins: [pluginReact(), pluginCssInline()],
      plugins: [pluginReact()],
    },
  });

  const { stats } = await rslib.build();
  if (stats) {
    const { assets } = stats.toJson({
      all: false,
      assets: true,
    });

    assets?.forEach(({ name, size }) => {
      if (name.endsWith(".css")) {
        cssFiles.push(name);
      }
    });

    await rewriteCssFiles(cssFiles, outPathSrc, 0);
    await writePackageJSON(packageJson, outPath, README);
    copyLicense(LICENCE_PATH, outPath);
  }
}
