import fs from "fs";

export const readPackageJson = (path = "package.json") => readJson(path);

type PackageExports = {
  ".": {
    import: string;
  };
  style?: {
    import: string;
  };
};

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
): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      files: filesFromPackageJson = [],
      main: _main,
      name: scopedPackageName,
      scripts: _scripts,
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

    const exports: PackageExports = {
      ".": { import: "./src/index.js" },
    };

    if (style) {
      exports.style = { import: style };
    }

    const newPackage: Json = {
      ...packageRest,
      files: filesToPublish.concat(["src"]),
      exports,
      module: "index.js",
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
