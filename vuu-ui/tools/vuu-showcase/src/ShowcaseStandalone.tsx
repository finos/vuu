import {
  assertModuleExportsAtLeastOneComponent,
  Density,
  getUrlParameter,
  ThemeMode,
  ThemeProvider,
} from "@finos/vuu-utils";
import { ReactNode, useMemo, useState } from "react";
import { getComponent, pathToExample, VuuExample } from "./showcase-utils";

import "./Showcase.css";

export const ShowcaseStandalone = ({
  density: densityProp,
  theme: themeProp,
  themeMode: themeModeProp,
}: {
  density?: Density;
  theme?: string;
  themeMode?: ThemeMode;
}) => {
  const [component, setComponent] = useState<ReactNode>(null);
  const [themeReady, setThemeReady] = useState(false);

  const theme = useMemo(
    () => themeProp ?? getUrlParameter("theme", "vuu"),
    [themeProp]
  );

  const asThemeMode = (input: string | undefined) => {
    if (input === 'light' || input === 'dark') {
      return input as ThemeMode
    } else {
      return "light" as ThemeMode
    }
  }
  
  const asDensity = ( input: string | undefined ) => {
    if (input === 'high' || input === 'low' || input === 'touch') {
      return input as Density
    } else {
      return "medium" as Density
    }
  }

  const themeMode = useMemo<ThemeMode>(
    () => themeModeProp ?? asThemeMode(getUrlParameter("themeMode", "light")),
    [themeModeProp]
  );

  const density = useMemo<Density>(
    () => densityProp ?? asDensity(getUrlParameter("density", "high")),
    [densityProp]
  );

  useMemo(() => {
    switch (theme) {
      case "vuu":
        import("./themes/vuu").then(() => {
          setThemeReady(true);
        });
        break;
      case "salt":
        import("./themes/salt").then(() => {
          setThemeReady(true);
        });
        break;
      default:
      // do nothing
    }
  }, [theme]);

  useMemo(async () => {
    const url = new URL(document.location.href);
    console.log(`url pathnasme ${url.pathname}`);
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
        console.log(`importPath ${importPath}`);
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

  if (themeReady || theme === "no-theme") {
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
  } else {
    return null;
  }
};
