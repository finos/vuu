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
  ComponentDescriptor,
  DocumentDescriptor,
  getTargetTreeNode,
  isComponentDescriptor,
  isDocumentDescriptor,
  loadTheme,
} from "./shared-utils";
import { DataLocation } from "./showcase-main/ShowcaseProvider";

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

const remoteName = "showcase_examples";
const remoteManifest = "/showcase-examples/mf-manifest.json";
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

// The theme is passed as a queryString parameter in the url
// themeMode and density are passed via the url hash, so can be
// changed without refreshing the page
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

  const [contentState, setContentState] = useState<ContentState | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

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
      loadTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(document.location.href);
    if (url.pathname === "/") {
      return undefined;
    }
    const targetTreeNode = getTargetTreeNode<unknown>(url, treeSource);
    const nodeData = targetTreeNode?.nodeData;
    if (!nodeData || (!isComponentDescriptor(nodeData) && !isDocumentDescriptor(nodeData))) {
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
  }, [treeSource]);

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
        {dataLocationRef.current === "local" ? (
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
