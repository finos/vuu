import ReactDOM from "react-dom";

import "@finos/vuu-theme/index.css";
import "@heswell/component-anatomy/esm/index.css";

import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/300-italic.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/400-italic.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/500-italic.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/600-italic.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/open-sans/700-italic.css";
import "@fontsource/open-sans/800.css";
import "@fontsource/open-sans/800-italic.css";

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
};

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

const url = new URL(document.location.href);
if (url.searchParams.has("standalone")) {
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
    root.classList.add("vuu-standalone", "salt-theme", "salt-density-medium");
    root.dataset.mode = "light";
    const Component = getComponent(targetExamples, path);
    if (Component) {
      ReactDOM.render(<Component />, root);
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
  // import(modulePath)
  // .then(obj => <module object>)
  // .catch(err => <loading error, e.g. if no such module>)

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
