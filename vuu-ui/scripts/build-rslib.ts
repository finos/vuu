import { createRslib } from "@rslib/core";
import { pluginReact } from "@rsbuild/plugin-react";
import fs from "fs";
import path from "path";
import { copyLicense } from "./copy-license.ts";
import { readPackageJson, writePackageJSON } from "./package-json.ts";

const DIST_PATH = "../../dist";
const LICENCE_PATH = "../../../LICENSE";
const README = "README.md";
const BUNDLED_DEPENDENCIES = [
  "@dnd-kit/abstract",
  "@dnd-kit/collision",
  "@dnd-kit/dom",
  "@dnd-kit/geometry",
  "@dnd-kit/react",
  "@dnd-kit/state",
  "tslib",
];
const BUNDLED_DND_DEPENDENCIES = BUNDLED_DEPENDENCIES.filter(
  (dependency) => dependency !== "tslib",
);

function rewriteCssFiles(cssFiles: string[], outDir: string) {
  return Promise.all(
    cssFiles.map(async (cssFile) => {
      const outPath = path.resolve(outDir, cssFile);
      await fs.promises.rename(outPath, `${outPath}.js`);
    }),
  );
}

async function copyBundledDependencies(outDir: string) {
  const nodeModulesPath = path.resolve("..", "..", "node_modules");
  const outNodeModulesPath = path.join(outDir, "node_modules");

  await Promise.all(
    BUNDLED_DND_DEPENDENCIES.map(async (dependency) => {
      const sourcePath = path.join(nodeModulesPath, dependency);
      const destinationPath = path.join(outNodeModulesPath, dependency);
      await fs.promises.rm(destinationPath, { force: true, recursive: true });
      await fs.promises.mkdir(path.dirname(destinationPath), {
        recursive: true,
      });
      await fs.promises.cp(sourcePath, destinationPath, {
        filter: (filePath) =>
          fs.statSync(filePath).isDirectory() ||
          /(?:\.js|\.js\.map|\.d\.ts)$/.test(path.basename(filePath)) ||
          path.basename(filePath) === "package.json",
        recursive: true,
      });
    }),
  );
  const tslibPath = path.join(nodeModulesPath, "tslib");
  const tslibDestinationPath = path.join(outNodeModulesPath, "tslib");
  await fs.promises.rm(tslibDestinationPath, { force: true, recursive: true });
  await fs.promises.mkdir(path.dirname(tslibDestinationPath), {
    recursive: true,
  });
  await fs.promises.cp(tslibPath, tslibDestinationPath, { recursive: true });

  const signalsPackage = "@preact/signals-core";
  const signalsSourcePath = path.join(nodeModulesPath, signalsPackage);
  const signalsDestinationPath = path.join(outNodeModulesPath, signalsPackage);
  await fs.promises.rm(signalsDestinationPath, {
    force: true,
    recursive: true,
  });
  await fs.promises.mkdir(path.join(signalsDestinationPath, "dist"), {
    recursive: true,
  });
  await fs.promises.copyFile(
    path.join(signalsSourcePath, "package.json"),
    path.join(signalsDestinationPath, "package.json"),
  );
  await Promise.all(
    ["signals-core.js", "signals-core.js.map"].map((fileName) =>
      fs.promises.copyFile(
        path.join(signalsSourcePath, "dist", fileName),
        path.join(signalsDestinationPath, "dist", fileName),
      ),
    ),
  );

  const signalsPackageJsonPath = path.join(
    signalsDestinationPath,
    "package.json",
  );
  const signalsPackageJson = JSON.parse(
    await fs.promises.readFile(signalsPackageJsonPath, "utf8"),
  ) as {
    module?: string;
    exports?: {
      ".": {
        browser?: string;
        import?: string;
      };
    };
  };
  signalsPackageJson.module = "./dist/signals-core.js";
  if (signalsPackageJson.exports?.["."]) {
    signalsPackageJson.exports["."].browser = "./dist/signals-core.js";
    signalsPackageJson.exports["."].import = "./dist/signals-core.js";
  }
  await fs.promises.writeFile(
    signalsPackageJsonPath,
    `${JSON.stringify(signalsPackageJson, null, 2)}\n`,
  );
}

export default async function main() {
  const packageJson = readPackageJson();
  const { name: scopedPackageName } = packageJson;
  const [, packageName] = scopedPackageName.split("/");
  const outPath = `${DIST_PATH}/${packageName}`;
  const outPathSrc = `${outPath}/src`;
  const shouldBundleDependencies = packageName === "vuu-utils";

  const rslib = await createRslib({
    config: {
      lib: [
        {
          banner: { css: "const css = `" },
          bundle: false,
          dts: false,
          footer: { css: "`;\nexport default css;" },
          format: "esm",
          autoExtension: false,
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
  if (shouldBundleDependencies) {
    await copyBundledDependencies(outPath);
  }
  await writePackageJSON(
    packageJson,
    outPath,
    README,
    shouldBundleDependencies ? ["node_modules"] : [],
  );
  await copyLicense(LICENCE_PATH, outPath);
}
