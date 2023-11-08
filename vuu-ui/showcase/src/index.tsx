import "@finos/vuu-icons/index.css";
import { ThemeProvider } from "@finos/vuu-shell";
import "@finos/vuu-theme/index.css";
import { getUrlParameter, hasUrlParameter } from "@finos/vuu-utils";
import "@salt-ds/theme/index.css";
import ReactDOM from "react-dom";
import { ExamplesModule } from "./App";
import { addStylesheetURL } from "./utils";

import "./index.css";

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
  if (importedEntity.default) {
    return importedEntity.default as ReactExample;
  }
};

const themeName = getUrlParameter("theme", "salt");

const fontCssUrl =
  themeName === "salt"
    ? "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800&display=swap"
    : "https://fonts.googleapis.com/css?family=Nunito+Sans:300,400,500,600,700&display=swap";
addStylesheetURL(fontCssUrl);

const pathToExample = (path: string): [string[], string] => {
  const endOfImportPath = path.lastIndexOf("/");
  const importPath =
    endOfImportPath === -1 ? path : path.slice(0, endOfImportPath);
  const suffix = env === "development" ? "" : ".js";
  const exampleName = path.slice(endOfImportPath + 1);
  if (exampleName === "") {
    return [[], ""];
  } else {
    return [
      [
        `./examples/${importPath}.examples${suffix}`,
        `./examples/${importPath}/index${suffix}`,
        `./examples/${importPath}/${importPath}${suffix}`,
      ],
      exampleName,
    ];
  }
};

if (hasUrlParameter("standalone")) {
  const url = new URL(document.location.href);
  const [targetPaths, exampleName] = pathToExample(url.pathname.slice(1));
  let targetExamples = null;
  const path = [exampleName];
  for (const importPath of targetPaths) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      targetExamples = await import(/* @vite-ignore */ importPath);
      if (importPath.endsWith("index")) {
        const parentFolder = importPath.split("/").at(-2);
        if (parentFolder) {
          path.unshift(parentFolder);
        }
      }
      if (
        targetExamples &&
        Object.values(targetExamples).every((item) => isModule(item as any))
      ) {
        throw Error("module file, no components");
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
        <ThemeProvider
          applyThemeClasses
          theme={themeName}
          density="high"
          themeMode="light"
        >
          <div className="vuuShowcase-StandaloneRoot">
            <Component />
          </div>
        </ThemeProvider>,
        root
      );
    } else {
      console.warn(`Example Component ${exampleName} not found`);
    }
  } else if (exampleName) {
    console.error(
      `Unable to load Component(s), are you using the correct file structure for your examples ?
       paths ${targetPaths.join("\n")} `
    );
  } else {
    // root app has been loaded with no example selection, therefore nothing to load into iframe
  }
} else {
  import("./examples/index")
    // A type error will appear here if any story is exported that does not assign displaySequence
    .then((stories: ExamplesModule) => {
      import("./AppRoutes")
        .then(({ AppRoutes }) => {
          ReactDOM.render(
            <AppRoutes stories={stories as ExamplesModule} />,
            document.getElementById("root")
          );
        })
        .catch((err) =>
          console.error(`error loading AppRoutes ${err.message}`)
        );
    })
    .catch((err) => console.error(`error loading stories ${err.message}`));
}
