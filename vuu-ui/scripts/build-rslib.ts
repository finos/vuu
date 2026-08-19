import { createRslib } from "@rslib/core";
import { pluginReact } from "@rsbuild/plugin-react";
import fs from "fs";
import path from "path";
import { copyLicense } from "./copy-license.ts";
import { readPackageJson, writePackageJSON } from "./package-json.ts";

const DIST_PATH = "../../dist";
const LICENCE_PATH = "../../../LICENSE";
const README = "README.md";
const BUNDLED_DND_DEPENDENCIES = [
  "@dnd-kit/abstract",
  "@dnd-kit/collision",
  "@dnd-kit/dom",
  "@dnd-kit/geometry",
  "@dnd-kit/react",
  "@dnd-kit/state",
] as const;
const VENDORED_PACKAGE_ROOTS = {
  "@dnd-kit/abstract": "abstract",
  "@dnd-kit/collision": "collision",
  "@dnd-kit/dom": "dom",
  "@dnd-kit/geometry": "geometry",
  "@dnd-kit/react": "react",
  "@dnd-kit/state": "state",
  "@preact/signals-core": "signals-core",
} as const;

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
  const vendorPath = path.join(outDir, "src", "vendor");

  await Promise.all(
    BUNDLED_DND_DEPENDENCIES.map(async (dependency) => {
      const sourcePath = path.join(nodeModulesPath, dependency);
      const destinationPath = path.join(
        vendorPath,
        "@dnd-kit",
        VENDORED_PACKAGE_ROOTS[dependency],
      );
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
  const tslibDestinationPath = path.join(vendorPath, "tslib");
  await fs.promises.rm(tslibDestinationPath, { force: true, recursive: true });
  await fs.promises.mkdir(path.dirname(tslibDestinationPath), {
    recursive: true,
  });
  await fs.promises.cp(tslibPath, tslibDestinationPath, { recursive: true });

  const signalsSourcePath = path.join(nodeModulesPath, "@preact/signals-core");
  const signalsDestinationPath = path.join(
    vendorPath,
    "@preact",
    "signals-core",
  );
  await fs.promises.rm(signalsDestinationPath, { force: true, recursive: true });
  await fs.promises.mkdir(path.join(signalsDestinationPath, "dist"), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(signalsDestinationPath, "package.json"),
    JSON.stringify({ name: "@preact/signals-core", type: "commonjs" }, null, 2),
  );
  await Promise.all(
    ["signals-core.js", "signals-core.js.map"].map((fileName) =>
      fs.promises.copyFile(
        path.join(signalsSourcePath, "dist", fileName),
        path.join(signalsDestinationPath, "dist", fileName),
      ),
    ),
  );
  await rewriteVendorImports(path.join(outDir, "src"), vendorPath);
}

async function rewriteVendorImports(sourcePath: string, vendorPath: string) {
  const entries = await fs.promises.readdir(sourcePath, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(sourcePath, entry.name);
      if (entry.isDirectory()) {
        await rewriteVendorImports(entryPath, vendorPath);
        return;
      }
      if (!entry.name.endsWith(".js")) return;

      const source = await fs.promises.readFile(entryPath, "utf8");
      const rewritten = source.replace(
        /((?:from\s+|import\s*\(\s*|require\s*\(\s*))(['"])(@dnd-kit\/[^'"]+|@preact\/signals-core|tslib)\2/g,
        (match, prefix, quote, specifier) => {
          const relativeImport = getVendorImportPath(
            entryPath,
            vendorPath,
            specifier,
          );
          return relativeImport
            ? `${prefix}${quote}${relativeImport}${quote}`
            : match;
        },
      );
      if (rewritten !== source) {
        await fs.promises.writeFile(entryPath, rewritten);
      }
    }),
  );
}

function getVendorImportPath(
  importingFile: string,
  vendorPath: string,
  specifier: string,
) {
  if (specifier === "tslib") {
    return relativeImport(
      importingFile,
      path.join(vendorPath, "tslib", "tslib.es6.mjs"),
    );
  }
  if (specifier === "@preact/signals-core") {
    return relativeImport(
      importingFile,
      path.join(vendorPath, "@preact", "signals-core", "dist", "signals-core.js"),
    );
  }

  const packageName = specifier.match(/^(@dnd-kit\/[^/]+)/)?.[1];
  if (!packageName || !(packageName in VENDORED_PACKAGE_ROOTS)) return undefined;
  const subpath = specifier.slice(packageName.length + 1);
  const packagePath = path.join(
    vendorPath,
    "@dnd-kit",
    VENDORED_PACKAGE_ROOTS[packageName as keyof typeof VENDORED_PACKAGE_ROOTS],
  );
  const targetPath = subpath
    ? path.join(packagePath, `${subpath}.js`)
    : path.join(
      packagePath,
      packageName === "@dnd-kit/geometry" ||
        packageName === "@dnd-kit/collision" ||
        packageName === "@dnd-kit/state"
        ? "dist/index.js"
        : "index.js",
    );
  return relativeImport(importingFile, targetPath);
}

function relativeImport(fromFile: string, targetFile: string) {
  const relativePath = path.relative(path.dirname(fromFile), targetFile);
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
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
                "src/**/*.js",
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
