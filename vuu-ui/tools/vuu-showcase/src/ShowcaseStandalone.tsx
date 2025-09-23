import { SaltProvider } from "@salt-ds/core";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  Density,
  getUrlParameter,
  ThemeMode,
  TreeSourceNode,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  getTargetTreeNode,
  isComponentDescriptor,
  loadTheme,
} from "./shared-utils";
import { DataLocation } from "./showcase-main/ShowcaseProvider";
import { simulModule } from "@vuu-ui/vuu-data-test";

import "./Showcase.css";

console.log(typeof simulModule);

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

const asDataLocation = (input: string | undefined): DataLocation => {
  if (input === "local" || input === "remote") {
    return input;
  } else {
    return "local";
  }
};

type ContentState = {
  component: ReactNode;
  isMDX: boolean;
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
  const dataLocationRef = useRef<DataLocation>("local");

  const [contentState, setContentState] = useState<ContentState | null>(null);
  const [themeReady, setThemeReady] = useState(true);

  // We only need this once as entire page will refresh if theme changes
  const theme = useMemo(() => getUrlParameter("theme", "vuu-theme"), []);

  useEffect(() => {
    const checkUrlParams = () => {
      const _themeMode = asThemeMode(getUrlParameter("themeMode"));
      const _dataLocation = asDataLocation(getUrlParameter("dataLocation"));
      const _density = asDensity(getUrlParameter("density"));
      if (
        _themeMode !== themeModeRef.current ||
        _density !== densityRef.current ||
        _dataLocation !== dataLocationRef.current
      ) {
        dataLocationRef.current = _dataLocation;
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
    const { nodeData } = getTargetTreeNode<unknown>(url, treeSource);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const targetModule: Module = await import(
        /* @vite-ignore */ `/${nodeData.path}`
      );

      if (targetModule) {
        if (isComponentDescriptor(nodeData)) {
          const Component = targetModule[nodeData.componentName];
          if (Component) {
            setContentState({
              component: <Component />,
              isMDX: nodeData.path.endsWith("mdx"),
            });
          } else {
            console.warn(`Example Componentnot found`);
          }
        } else {
          const Component = targetModule.default;
          setContentState({
            component: <Component />,
            isMDX: nodeData.path.endsWith("mdx"),
          });
        }
      } else {
        // root app has been loaded with no example selection, therefore nothing to load into iframe
      }
    } catch (err) {
      const match = err.message.match(/[a-zA-Z]*.css/);
      if (match) {
        console.log(
          `A component is trying to load ${match[0]} using salt css injection. The css plugin has not converted this file. See showcase-vite-api.ts`,
        );
      } else {
        throw err;
      }
    }
  }, [treeSource]);

  if (themeReady || theme === "no-theme") {
    return (
      <SaltProvider
        theme={theme}
        density={densityRef.current}
        mode={themeModeRef.current}
      >
        {dataLocationRef.current === "local" ? (
          <LocalDataSourceProvider>
            <div
              className={cx("vuuShowcase-StandaloneRoot", {
                "vuuShowcase-mdx": contentState?.isMDX,
              })}
            >
              {contentState?.component}
            </div>
          </LocalDataSourceProvider>
        ) : (
          <VuuDataSourceProvider
            authenticate={false}
            autoConnect
            autoLogin
            // websocketUrl="ws://localhost:8091/websocket"
            websocketUrl="wss://localhost:8090/websocket"
          >
            <div
              className={cx("vuuShowcase-StandaloneRoot", {
                "vuuShowcase-mdx": contentState?.isMDX,
              })}
            >
              {contentState?.component}
            </div>
          </VuuDataSourceProvider>
        )}
      </SaltProvider>
    );
  } else {
    return null;
  }
};
