import {
  Density,
  getUrlParameter,
  ThemeMode,
  TreeSourceNode,
} from "@finos/vuu-utils";
import { SaltProvider } from "@salt-ds/core";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  getTargetPath,
  isComponentDescriptor,
  loadTheme,
} from "./shared-utils";

import "./Showcase.css";

const asThemeMode = (input: string | undefined): ThemeMode => {
  if (input === "light" || input === "dark") {
    return input;
  } else {
    return "light";
  }
};

const themeIsInstalled = (theme = "no-theme"): theme is string => {
  return ["salt-theme", "vuu-theme", "tar-theme"].includes(theme);
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
export const ShowcaseStandalone = ({
  treeSource,
}: {
  treeSource: TreeSourceNode[];
}) => {
  const [, forceRefresh] = useState({});
  const densityRef = useRef<Density>("high");
  const themeModeRef = useRef<ThemeMode>("light");

  const [component, setComponent] = useState<ReactNode>(null);
  const [themeReady, setThemeReady] = useState(true);

  // We only need this once as entire page will refresh if theme changes
  const theme = useMemo(() => getUrlParameter("theme", "vuu-theme"), []);

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
    if (themeIsInstalled(theme)) {
      loadTheme(theme).then(() => {
        setThemeReady(true);
      });
    }
  }, [theme]);

  useMemo(async () => {
    const url = new URL(document.location.href);
    const target = getTargetPath(url, treeSource);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const targetModule: Module = await import(
        /* @vite-ignore */ `/${target.path}`
      );

      if (targetModule) {
        if (isComponentDescriptor(target)) {
          const Component = targetModule[target.componentName];
          if (Component) {
            setComponent(<Component />);
          } else {
            console.warn(`Example Componentnot found`);
          }
        } else {
          const Component = targetModule.default;
          setComponent(<Component />);
        }
      } else {
        // root app has been loaded with no example selection, therefore nothing to load into iframe
      }
    } catch (err) {
      console.log(`>>>>>>> dfsfddfldfld`);
    }
  }, [treeSource]);

  if (themeReady || theme === "no-theme") {
    return (
      <SaltProvider
        theme={theme}
        density={densityRef.current}
        mode={themeModeRef.current}
      >
        <div className="vuuShowcase-StandaloneRoot">{component}</div>
      </SaltProvider>
    );
  } else {
    return null;
  }
};
