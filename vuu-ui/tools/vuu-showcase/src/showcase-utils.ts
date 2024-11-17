import { importCSS, isModule, Module, ReactComponent } from "@finos/vuu-utils";

type Environment = "development" | "production";
export const env = process.env.NODE_ENV as Environment;

export type VuuExample = {
  (props?: { [key: string]: unknown }): JSX.Element;
  displaySequence: number;
};

export const pathFromKey = (key: string) => key.slice(5).split("|").join("/");
export const keysFromPath = (path: string) => {
  if (path === "/") {
    return undefined;
  } else {
    return [`$root${path.split("/").join("|")}`];
  }
};

export const pathToExample = (path: string): [string[], string] => {
  const endOfImportPath = path.lastIndexOf("/");
  const importPath =
    endOfImportPath === -1 ? path : path.slice(0, endOfImportPath);
  const suffix = env === "development" ? "" : ".js";
  const exampleName = path.slice(endOfImportPath + 1);
  if (exampleName === "") {
    return [[], ""];
  } else {
    const root = env === "development" ? "/src" : "";
    return [
      [
        `${root}/examples/${importPath}/${exampleName}${suffix}`,
        `${root}/examples/${importPath}.examples${suffix}`,
        `${root}/examples/${importPath}/index${suffix}`,
      ],
      exampleName,
    ];
  }
};

export const getComponent = <T = ReactComponent>(
  module: Module,
  paths: string[],
): T | undefined => {
  let importedEntity = module;
  while (paths.length > 0) {
    const key = paths.shift() as string;
    if (key in importedEntity) {
      const entity = importedEntity[key];
      if (isModule(entity)) {
        importedEntity = importedEntity[key] as Module;
      } else {
        return importedEntity[key] as T;
      }
    }
  }
  if (importedEntity.default) {
    return importedEntity.default as T;
  }
};

export const loadTheme = (themeName: string): Promise<void> =>
  new Promise((resolve) => {
    if (env === "development") {
      import(`./themes/${themeName}.ts`).then(() => {
        resolve();
      });
    } else {
      importCSS(`/themes/${themeName}.css`).then((styleSheet) => {
        document.adoptedStyleSheets = [
          ...document.adoptedStyleSheets,
          styleSheet,
        ];
        resolve();
      });
    }
  });
