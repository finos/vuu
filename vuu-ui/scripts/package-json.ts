import fs from "fs";

export const readPackageJson = (path = "package.json") => readJson(path);

type PackageExports = Record<
  string,
  {
    import: string;
    types?: string;
  }
>;

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
  const {
    exports: sourceExports,
    files: filesFromPackageJson = [],
    name: scopedPackageName,
    style,
    ...packageRest
  } = packageJson;

  const filesToPublish = Array.from(
    new Set(filesFromPackageJson.concat(readmePath)),
  );

  await Promise.all(
    filesToPublish.map((fileName) =>
      fs.promises.cp(fileName.replace(/^\//, "./"), `${outdir}/${fileName}`, {
        recursive: true,
      }),
    ),
  );

  const exports: PackageExports = Object.fromEntries(
    Object.entries(
      sourceExports ?? { ".": "./src/index.ts" },
    ).map(([subpath, target]) => {
      const importPath = typeof target === "string" ? target : target.import;
      return [subpath, { import: importPath.replace(/\.tsx?$/, ".js") }];
    }),
  );

  if (style) {
    const styleExport = {
      types: `${style}.d.ts`,
      import: style,
    };
    exports["./style"] = styleExport;
    exports[style] = styleExport;
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

  await fs.promises.writeFile(
    `${outdir}/package.json`,
    JSON.stringify(newPackage, null, 2),
  );
}
