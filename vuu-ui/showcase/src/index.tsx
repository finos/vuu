import ReactDOM from "react-dom";
import { getUrlParameter, hasUrlParameter } from "@finos/vuu-utils";

import "@finos/vuu-theme/index.css";
import "@finos/vuu-theme-purple/index.css";
import "@heswell/component-anatomy/esm/index.css";

import "./index.css";
import { ThemeProvider } from "@finos/vuu-shell";

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;

type ReactExample = () => JSX.Element;
type Module = { [key: string]: Module | ReactExample };
const isModule = (entity: Module | ReactExample): entity is Module =>
  entity !== undefined && typeof entity !== "function";

const getComponent = (module: Module, paths: string[]) => {
  let importedEntity = module;
  while (paths.length > 0) {
    const key = paths.shift() as string;
    if (key in importedEntity) {
      const entity = importedEntity[key];
      if (isModule(entity)) {
        importedEntity = importedEntity[key] as Module;
      } else {
        return importedEntity[key] as ReactExample;
      }
    }
  }
};

function addStylesheetURL(url: string) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.getElementsByTagName("head")[0].appendChild(link);
}

const themeName = getUrlParameter("theme", "salt");
console.log({ themeName });

const fontCssUrl =
  themeName === "salt"
    ? "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800&display=swap"
    : "https://fonts.googleapis.com/css?family=Nunito+Sans:300,400,500,600,700&display=swap";
addStylesheetURL(fontCssUrl);

const pathToExample = (path: string): [string[], string] => {
  const endOfImportPath = path.lastIndexOf("/");
  const importPath = path.slice(0, endOfImportPath);
  const suffix = env === "development" ? "" : ".js";
  return [
    [
      `./examples/${importPath}.examples${suffix}`,
      `./examples/${importPath}/index${suffix}`,
      `./examples/${importPath}.stories${suffix}`,
    ],
    path.slice(endOfImportPath + 1),
  ];
};

if (hasUrlParameter("standalone")) {
  const url = new URL(document.location.href);
  const [targetPaths, exampleName] = pathToExample(url.pathname.slice(1));
  let targetExamples = null;
  const path = [exampleName];
  for (const importPath of targetPaths) {
    try {
      console.log(`import from ${importPath}`);
      targetExamples = await import(/* @vite-ignore */ importPath);
      if (importPath.endsWith("index")) {
        const parentFolder = importPath.split("/").at(-2);
        if (parentFolder) {
          path.unshift(parentFolder);
        }
      }
      break;
    } catch (err) {
      continue;
    }
  }
  if (targetExamples) {
    const root = document.getElementById("root") as HTMLDivElement;
    const Component = getComponent(targetExamples, path);
    if (Component) {
      ReactDOM.render(
        <ThemeProvider theme={themeName} density="high" themeMode="light">
          <Component />
        </ThemeProvider>,
        root
      );
    } else {
      console.warn(`Example Component ${exampleName} not found`);
    }
  } else {
    console.error(
      `Unable to load Component(s), are you using the correct file structure for your examples ?
       paths ${targetPaths.join("\n")} `
    );
  }
} else {
  import("./examples/index")
    .then((stories) => {
      import("./AppRoutes")
        .then(({ AppRoutes }) => {
          ReactDOM.render(
            <AppRoutes stories={stories} />,
            document.getElementById("root")
          );
        })
        .catch((err) =>
          console.error(`error loading AppRoutes ${err.message}`)
        );
    })
    .catch((err) => console.error(`error loading stories ${err.message}`));
}
