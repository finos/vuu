import ReactDOM from "react-dom";
// import { AppRoutes } from "./AppRoutes";

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

// import * as stories from "./examples";
import "./index.css";

const pathToExample = (path: string): [string[], string] => {
  const endOfImportPath = path.lastIndexOf("/");
  const importPath = path.slice(0, endOfImportPath);
  return [
    [
      `./examples/${importPath}/index`,
      `./examples/${importPath}.stories`,
      `./examples/${importPath}.examples`,
    ],
    path.slice(endOfImportPath + 1),
  ];
};

const url = new URL(document.location.href);
if (url.searchParams.has("standalone")) {
  const [targetPaths, exampleName] = pathToExample(url.pathname.slice(1));
  for (const importPath of targetPaths) {
    console.log({ importPath, exampleName });
    try {
      const root = document.getElementById("root") as HTMLDivElement;
      root.classList.add("vuu-standalone", "salt-theme", "salt-density-medium");
      root.dataset.mode = "light";
      const targetExamples = await import(/* @vite-ignore */ importPath);
      if (exampleName in targetExamples) {
        const Component = targetExamples[exampleName];
        ReactDOM.render(<Component />, root);
      }
      break;
    } catch (err) {
      // no harm
    }
  }
} else {
  const stories = await import("./examples/index");
  const { AppRoutes } = await import("./AppRoutes");

  ReactDOM.render(
    <AppRoutes stories={stories} />,
    document.getElementById("root")
  );
}
