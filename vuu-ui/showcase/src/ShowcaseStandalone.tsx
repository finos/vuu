import {
  assertModuleExportsAtLeastOneComponent,
  Density,
  ThemeMode,
  ThemeProvider,
} from "@finos/vuu-utils";
import { ReactNode, useMemo, useState } from "react";
import { getComponent, pathToExample, VuuExample } from "./showcase-utils";

export const ShowcaseStandalone = ({
  density = "high",
  theme = "vuu",
  themeMode = "light",
}: {
  density?: Density;
  theme?: string;
  themeMode?: ThemeMode;
}) => {
  const [component, setComponent] = useState<ReactNode>(null);
  useMemo(async () => {
    const url = new URL(document.location.href);
    const [targetPaths, exampleName] = pathToExample(url.pathname.slice(1));
    console.log({
      pathname: url.pathname,
      path: url.pathname.slice(1),
      targetPaths,
      exampleName,
    });
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
        assertModuleExportsAtLeastOneComponent(targetExamples);
        break;
      } catch (err) {
        continue;
      }
    }
    if (targetExamples) {
      const Component = getComponent<VuuExample>(targetExamples, path);
      if (Component) {
        console.log({ Component });
        setComponent(<Component />);
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
  }, []);

  return (
    <ThemeProvider
      applyThemeClasses
      theme={theme}
      density={density}
      themeMode={themeMode}
    >
      <div className="vuuShowcase-StandaloneRoot">{component}</div>
    </ThemeProvider>
  );
};
