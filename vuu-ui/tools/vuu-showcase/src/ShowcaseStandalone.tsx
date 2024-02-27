import {
  assertModuleExportsAtLeastOneComponent,
  Density,
  getUrlParameter,
  ThemeMode,
  ThemeProvider,
} from "@finos/vuu-utils";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { getComponent, pathToExample, VuuExample } from "./showcase-utils";

import "./Showcase.css";

const asThemeMode = (input: string | undefined): ThemeMode => {
  if (input === "light" || input === "dark") {
    return input;
  } else {
    return "light";
  }
};

const asDensity = (input: string | undefined): Density => {
  if (input === "high" || input === "low" || input === "touch") {
    return input;
  } else {
    return "medium";
  }
};

// The theme is passed as a queryString parameter in the url
// themeMode and density are passed via the url hash, so can be
// changed without refreshing the page
export const ShowcaseStandalone = () => {
  const [, forceRefresh] = useState({});
  const densityRef = useRef<Density>("high");
  const themeModeRef = useRef<ThemeMode>("light");

  const [component, setComponent] = useState<ReactNode>(null);
  const [themeReady, setThemeReady] = useState(false);

  // We only need this once as entire page will refresh if theme changes
  const theme = useMemo(() => getUrlParameter("theme", "vuu"), []);

  useEffect(() => {
    const checkUrlParams = () => {
      const _themeMode = asThemeMode(getUrlParameter("themeMode"));
      const _density = asDensity(getUrlParameter("density"));
      if (
        _themeMode !== themeModeRef.current ||
        _density !== densityRef.current
      ) {
        densityRef.current = _density;
        themeModeRef.current = _themeMode;
        forceRefresh({});
      }
    };
    addEventListener("hashchange", checkUrlParams);
    checkUrlParams();
  }, []);

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
        assertModuleExportsAtLeastOneComponent(targetExamples);
        break;
      } catch (err) {
        continue;
      }
    }
    if (targetExamples) {
      const Component = getComponent<VuuExample>(targetExamples, path);
      if (Component) {
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
        density={densityRef.current}
        themeMode={themeModeRef.current}
      >
        <div className="vuuShowcase-StandaloneRoot">{component}</div>
      </ThemeProvider>
    );
  } else {
    return null;
  }
};
