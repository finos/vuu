import {
  type Accent,
  type ActionFont,
  type HeadingFont,
  SaltProviderNext,
} from "@salt-ds/core";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  type Density,
  getUrlParameter,
  hasUrlParameter,
  ThemeLoadChecker,
  type ThemeMode,
  type TreeSourceNode,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type ExhibitImporter,
  getTargetTreeNode,
  importExhibitByUrl,
  isComponentDescriptor,
  loadTheme,
} from "./shared-utils";
import type { DataLocation } from "./showcase-main/ShowcaseProvider";
import {
  decodeExampleProps,
  describeActionArgs,
  EXAMPLE_ACTION_MESSAGE,
  EXAMPLE_PROPS_MESSAGE,
  type ExampleActionMessage,
  type ExamplePropDefs,
  type ExamplePropsMessage,
  getExamplePropDefs,
  PROPS_PARAM,
  sanitiseExampleProps,
} from "./example-props";
import { OPEN_PALETTE_MESSAGE } from "./showcase-main/command-palette/palette-messages";
import { simulModule } from "@vuu-ui/vuu-data-test";

import "./Showcase.css";

console.log(typeof simulModule);

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
  Component: ComponentType<Record<string, unknown>>;
  propDefs?: ExamplePropDefs;
};

const readHashProps = () =>
  new URL(document.location.href).hash.match(
    new RegExp(`[#,]${PROPS_PARAM}=([-_A-Za-z0-9]*)`),
  )?.[1] ?? "";

/**
 * Callback props declared by the example are reported to the showcase, which
 * shows them in its actions log. Standalone, in its own window, they are
 * logged to the console.
 */
const createActionHandlers = (defs: ExamplePropDefs = {}) =>
  Object.fromEntries(
    Object.entries(defs)
      .filter(([, def]) => def.type === "action")
      .map(([name]) => [
        name,
        (...args: unknown[]) => {
          const message: ExampleActionMessage = {
            args: describeActionArgs(args),
            name,
            type: EXAMPLE_ACTION_MESSAGE,
          };
          if (window.parent === window) {
            console.log(`[action] ${name}`, ...args);
          } else {
            window.parent.postMessage(message, window.location.origin);
          }
        },
      ]),
  );

/**
 * An embedded example (an example within a document) sizes its iframe to fit
 * its content. The iframe is same origin, so it can be sized directly.
 */
const useFitFrameToContent = (embed: boolean) =>
  useCallback(
    (root: HTMLDivElement | null) => {
      const frame = window.frameElement as HTMLIFrameElement | null;
      if (!embed || !frame || !root) return;
      // the root mounts once the theme has loaded, hence a callback ref
      const observer = new ResizeObserver(() => {
        frame.style.height = `${Math.ceil(root.getBoundingClientRect().height)}px`;
      });
      observer.observe(root);
      return () => observer.disconnect();
    },
    [embed],
  );

// The theme is passed as a queryString parameter in the url
// themeMode and density are passed via the url hash, so can be
// changed without refreshing the page
export const ShowcaseStandalone = ({
  importExhibit = importExhibitByUrl,
  treeSource,
}: {
  importExhibit?: ExhibitImporter;
  treeSource: TreeSourceNode[];
}) => {
  console.log("[ShowcaseStandalone] render");
  const [, forceRefresh] = useState({});
  const densityRef = useRef<Density>("high");
  const themeModeRef = useRef<ThemeMode>("light");
  const dataLocationRef = useRef<DataLocation>("local");
  const propsRef = useRef("");

  const [contentState, setContentState] = useState<ContentState | null>(null);

  // We only need this once as entire page will refresh if theme changes
  const theme = useMemo(() => getUrlParameter("theme", "vuu-theme"), []);
  const embed = useMemo(() => hasUrlParameter("embed"), []);
  const rootRef = useFitFrameToContent(embed);

  useEffect(() => {
    // keys pressed within the showcase iframe never reach the showcase
    if (window.parent === window) return;
    const forwardPaletteShortcut = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "k") {
        evt.preventDefault();
        window.parent.postMessage(
          { type: OPEN_PALETTE_MESSAGE },
          window.location.origin,
        );
      }
    };
    window.addEventListener("keydown", forwardPaletteShortcut);
    return () => window.removeEventListener("keydown", forwardPaletteShortcut);
  }, []);

  useEffect(() => {
    const checkUrlParams = () => {
      const _themeMode = asThemeMode(getUrlParameter("themeMode"));
      const _dataLocation = asDataLocation(getUrlParameter("dataLocation"));
      const _density = asDensity(getUrlParameter("density"));
      const _props = readHashProps();
      if (
        _themeMode !== themeModeRef.current ||
        _density !== densityRef.current ||
        _dataLocation !== dataLocationRef.current ||
        _props !== propsRef.current
      ) {
        dataLocationRef.current = _dataLocation;
        densityRef.current = _density;
        propsRef.current = _props;
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

  useMemo(async () => {
    const url = new URL(document.location.href);
    if (url.pathname === "/") {
      return;
    }
    const targetTreeNode = getTargetTreeNode<unknown>(url, treeSource);
    if (targetTreeNode) {
      const { nodeData } = targetTreeNode;
      try {
        const targetModule = await importExhibit(nodeData.path);

        if (targetModule) {
          if (isComponentDescriptor(nodeData)) {
            const Component = targetModule[nodeData.componentName] as
              | (ComponentType<Record<string, unknown>> & { props?: unknown })
              | undefined;
            if (Component) {
              const propDefs = getExamplePropDefs(Component.props);
              setContentState({ Component, propDefs });
              if (propDefs && window.parent !== window) {
                const message: ExamplePropsMessage = {
                  defs: propDefs,
                  type: EXAMPLE_PROPS_MESSAGE,
                };
                window.parent.postMessage(message, window.location.origin);
              }
            } else {
              console.warn("Example Componentnot found");
            }
          } else if (nodeData.path.endsWith("mdx")) {
            // documents render in the showcase chrome, see DocsStandalone
            console.warn(`[ShowcaseStandalone] ${nodeData.path} is a document`);
          } else {
            const Component = targetModule.default as ComponentType;
            setContentState({ Component });
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
    }
  }, [importExhibit, treeSource]);

  const propDefs = contentState?.propDefs;
  const actionHandlers = useMemo(
    () => createActionHandlers(propDefs),
    [propDefs],
  );
  const encodedProps = propsRef.current;
  const propValues = useMemo(
    () =>
      propDefs
        ? sanitiseExampleProps(propDefs, decodeExampleProps(encodedProps))
        : {},
    [encodedProps, propDefs],
  );

  let content: ReactNode = null;
  if (contentState) {
    const { Component } = contentState;
    content = <Component {...actionHandlers} {...propValues} />;
  }

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
                "vuuShowcase-embed": embed,
              })}
              ref={rootRef}
            >
              {content}
            </div>
          </LocalDataSourceProvider>
        ) : (
          <VuuDataSourceProvider
            authenticate={true}
            autoConnect
            autoLogin
            websocketUrl="wss://localhost:8090/websocket"
          >
            <div
              className={cx("vuuShowcase-StandaloneRoot", {
                "vuuShowcase-embed": embed,
              })}
              ref={rootRef}
            >
              {content}
            </div>
          </VuuDataSourceProvider>
        )}
      </ThemeLoadChecker>
    </SaltProviderNext>
  );
};
