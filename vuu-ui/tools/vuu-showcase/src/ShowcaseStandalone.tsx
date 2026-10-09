import {
  Accent,
  ActionFont,
  HeadingFont,
  SaltProviderNext,
} from "@salt-ds/core";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  Density,
  getUrlParameter,
  ThemeLoadChecker,
  ThemeMode,
  TreeSourceNode,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import {
  asHostMode,
  ComponentDescriptor,
  DocumentDescriptor,
  getDefaultHostMode,
  getTargetTreeNode,
  type HostMode,
  isComponentDescriptor,
  isDocumentDescriptor,
  loadTheme,
} from "./shared-utils";
import {
  SHOWCASE_REMOTE_NAME,
  SHOWCASE_REMOTE_URL,
  ShowcasePortalHost,
} from "./ShowcasePortalHost";
import { DataLocation } from "./showcase-main/ShowcaseProvider";
import { simulModule } from "@vuu-ui/vuu-data-test";

import "./Showcase.css";

const actionFont = "Nunito sans" as ActionFont;
const headingFont = "Nunito sans" as HeadingFont;
const accentPurple = "purple" as Accent;

const asThemeMode = (input: string | undefined): ThemeMode => {
  if (input === "light" || input === "dark") {
    return input;
  } else {
    return "light";
  }
};

const themeIsInstalled = (theme = "no-theme"): theme is string => {
  return ["salt-theme-next", "vuu-theme"].includes(theme);
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

type ExampleModule = Record<string, ComponentType>;

const remoteName = SHOWCASE_REMOTE_NAME;
const remoteManifest = `${SHOWCASE_REMOTE_URL}/mf-manifest.json`;
let showcaseRemoteRegistered = false;

const loadExampleModule = async (
  descriptor: ComponentDescriptor | DocumentDescriptor,
) => {
  if (!showcaseRemoteRegistered) {
    registerRemotes([{ entry: remoteManifest, name: remoteName }]);
    showcaseRemoteRegistered = true;
  }

  const module = await loadRemote<ExampleModule>(
    `${remoteName}/${descriptor.moduleName}`,
    { from: "runtime" },
  );
  if (module === null) {
    throw Error(`Unable to load showcase example ${descriptor.moduleName}`);
  }
  return module;
};

const getTargetNodeData = (treeSource: TreeSourceNode[]) => {
  const url = new URL(document.location.href);
  if (url.pathname === "/") {
    return undefined;
  }
  const nodeData = getTargetTreeNode<unknown>(url, treeSource)?.nodeData;
  return isComponentDescriptor(nodeData) || isDocumentDescriptor(nodeData)
    ? nodeData
    : undefined;
};

// The theme is passed as a queryString parameter in the url
// themeMode, density, dataLocation and host are passed via the url hash,
// so can be changed without refreshing the page. host defaults to "portal"
// for examples tagged remote-module.
export const ShowcaseStandalone = ({
  treeSource,
}: {
  treeSource: TreeSourceNode[];
}) => {
  console.log(`[ShowcaseStandalone] render`);
  const [, forceRefresh] = useState({});
  const densityRef = useRef<Density>("high");
  const themeModeRef = useRef<ThemeMode>("light");
  const dataLocationRef = useRef<DataLocation>("local");
  const hostModeRef = useRef<HostMode | undefined>(undefined);

  const [contentState, setContentState] = useState<ContentState | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // We only need this once as entire page will refresh if theme changes
  const theme = useMemo(() => getUrlParameter("theme", "vuu-theme"), []);

  useEffect(() => {
    const checkUrlParams = () => {
      const _themeMode = asThemeMode(getUrlParameter("themeMode"));
      const _dataLocation = asDataLocation(getUrlParameter("dataLocation"));
      const _density = asDensity(getUrlParameter("density"));
      const _hostMode = asHostMode(getUrlParameter("host"));
      if (
        _themeMode !== themeModeRef.current ||
        _density !== densityRef.current ||
        _dataLocation !== dataLocationRef.current ||
        _hostMode !== hostModeRef.current
      ) {
        dataLocationRef.current = _dataLocation;
        hostModeRef.current = _hostMode;
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
      loadTheme(theme);
    }
  }, [theme]);

  const nodeData = useMemo(() => getTargetNodeData(treeSource), [treeSource]);
  const hostMode = hostModeRef.current ?? getDefaultHostMode(nodeData);
  const portalHosted = hostMode === "portal" && isComponentDescriptor(nodeData);

  useEffect(() => {
    let cancelled = false;
    if (!nodeData || portalHosted) {
      return undefined;
    }

    setContentState(null);
    setLoadError(null);
    loadExampleModule(nodeData)
      .then((targetModule) => {
        const Component = isComponentDescriptor(nodeData)
          ? targetModule[nodeData.componentName]
          : targetModule.default;
        if (!Component) {
          throw Error(`Example component not found: ${nodeData.moduleName}`);
        }
        if (!cancelled) {
          setContentState({
            component: <Component />,
            isMDX: isDocumentDescriptor(nodeData),
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Unable to load showcase example", error);
          setLoadError(
            error instanceof Error
              ? error
              : new Error("Unable to load showcase example"),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nodeData, portalHosted]);

  return (
    <SaltProviderNext
      accent={accentPurple}
      corner="rounded"
      theme={theme}
      density={densityRef.current}
      mode={themeModeRef.current}
      actionFont={actionFont}
      headingFont={headingFont}
    >
      <ThemeLoadChecker theme={theme}>
        {portalHosted ? (
          <ShowcasePortalHost
            DataSourceProvider={
              dataLocationRef.current === "local"
                ? LocalDataSourceProvider
                : VuuDataSourceProvider
            }
            density={densityRef.current}
            descriptor={nodeData}
            mode={themeModeRef.current}
            path={document.location.pathname}
            theme={theme}
          />
        ) : dataLocationRef.current === "local" ? (
          <LocalDataSourceProvider>
            <div
              className={cx("vuuShowcase-StandaloneRoot", {
                "vuuShowcase-mdx": contentState?.isMDX,
              })}
            >
              {loadError ? loadError.message : contentState?.component}
            </div>
          </LocalDataSourceProvider>
        ) : (
          <VuuDataSourceProvider>
            <div
              className={cx("vuuShowcase-StandaloneRoot", {
                "vuuShowcase-mdx": contentState?.isMDX,
              })}
            >
              {loadError ? loadError.message : contentState?.component}
            </div>
          </VuuDataSourceProvider>
        )}
      </ThemeLoadChecker>
    </SaltProviderNext>
  );
};
