import fs from "fs";

export const readPackageJson = (path = "package.json") => readJson(path);

type PackageExport = string | { import: string };
type PackageExports = Record<string, PackageExport>;
type Json = {
  exports?: PackageExports;
  files?: string[];
  main?: string;
  name: string;
  style?: string;
  [key: string]: unknown;
};

export const readJson = (path: string) => {
  const rawdata = fs.readFileSync(path);
  return JSON.parse(rawdata.toString()) as Json;
};

export async function writePackageJSON(
  packageJson: Json,
  outdir: string,
  readmePath: string,
  additionalFiles: string[] = [],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      exports: sourceExports,
      files: filesFromPackageJson = [],
      name: scopedPackageName,
      style,
      ...packageRest
    } = packageJson;

    const files = [readmePath];
    const filesToPublish = filesFromPackageJson.concat(files);

    filesToPublish.forEach((fileName) => {
      const filePath = fileName.replace(/^\//, "./");
      const outPath = `${outdir}/${fileName}`;
      fs.cp(filePath, outPath, { recursive: true }, (err) => {
        if (err) throw err;
      });
    });

    const exports: PackageExports = Object.fromEntries(
      Object.entries(
        sourceExports ?? { ".": "./src/index.ts" },
      ).map(([subpath, target]) => {
        const importPath = typeof target === "string" ? target : target.import;
        return [subpath, { import: importPath.replace(/\.tsx?$/, ".js") }];
      }),
    );

    if (style) {
      exports.style = { import: style };
    }

    const newPackage: Json = {
      ...packageRest,
      files: filesToPublish.concat(additionalFiles, ["src"]),
      exports,
      main: "./src/index.js",
      module: "./src/index.js",
      name: scopedPackageName,
      style,
      type: "module",
    };

    fs.writeFile(
      `${outdir}/package.json`,
      JSON.stringify(newPackage, null, 2),
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}
