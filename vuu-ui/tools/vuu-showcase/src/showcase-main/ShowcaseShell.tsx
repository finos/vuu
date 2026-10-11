import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { version as vuuVersion } from "@vuu-ui/vuu-utils/package.json";
import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import { SaltProviderNext } from "@salt-ds/core";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { getTargetTreeNode, loadTheme } from "../shared-utils";
import {
  getStoredNavWidth,
  storeNavWidth,
  useChromeMode,
} from "./chrome/chrome-settings";
import { ShowcaseContent } from "./ShowcaseContent";
import { ShowcaseProvider } from "./ShowcaseProvider";
import { TopBar, type TopBarProps } from "./top-bar";
import {
  countExamples,
  getExampleNodes,
  type NavNodeData,
  sectionFromPath,
} from "./tree-nav/nav-tree";
import { focusNavFilter, ShowcaseNav } from "./tree-nav/ShowcaseNav";

import "./chrome/chrome.css";
import "./ShowcaseShell.css";

export interface AppProps {
  treeSource: TreeSourceNode[];
}

const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT");

type ChromeModeContextValue = ReturnType<typeof useChromeMode>;
const ChromeModeContext = createContext<ChromeModeContextValue>({
  chromeMode: "light",
  toggleChromeMode: () => undefined,
});

/**
 * GridLayout does not re-render its items when their props change, so state
 * is passed to the TopBar via context.
 */
const ShellTopBar = (
  props: Omit<TopBarProps, "chromeMode" | "onToggleChromeMode">,
) => {
  const { chromeMode, toggleChromeMode } = useContext(ChromeModeContext);
  return (
    <TopBar
      {...props}
      chromeMode={chromeMode}
      onToggleChromeMode={toggleChromeMode}
    />
  );
};

export const ShowcaseShell = ({ treeSource }: AppProps) => {
  const initialIsDataConsumer = useMemo(() => {
    const url = new URL(document.location.href);
    const treeNode = getTargetTreeNode(url, treeSource, false) as any;
    return (
      (treeNode && treeNode.nodeData.tags?.includes("data-consumer")) ?? false
    );
  }, [treeSource]);
  const exampleCount = useMemo(
    () =>
      countExamples(
        getExampleNodes(treeSource as TreeSourceNode<NavNodeData>[]),
      ),
    [treeSource],
  );
  // read once, the GridLayout owns the track sizes after the initial render
  const [colsAndRows] = useState(() => ({
    cols: [`${getStoredNavWidth()}px`, "1fr"],
    rows: ["52px", "1fr"],
  }));
  const [themeReady, setThemeReady] = useState(false);
  const [dataConsumer, setDataConsumer] = useState(initialIsDataConsumer);
  const chromeModeState = useChromeMode();
  const { chromeMode } = chromeModeState;

  useEffect(() => {
    loadTheme("vuu-theme").then(() => {
      setThemeReady(true);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "k") {
        evt.preventDefault();
        focusNavFilter();
      } else if (
        evt.key === "/" &&
        !evt.metaKey &&
        !evt.ctrlKey &&
        !evt.altKey &&
        !isTextEntryTarget(evt.target)
      ) {
        evt.preventDefault();
        focusNavFilter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { pathname } = useLocation();
  const section = sectionFromPath(pathname);
  const handleSelectExample = useCallback((nodeData?: NavNodeData) => {
    setDataConsumer(nodeData?.tags?.includes("data-consumer") ?? false);
  }, []);

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>(
    (_gridId, { cols }) => {
      const navWidth = parseInt(cols[0], 10);
      if (!isNaN(navWidth)) {
        storeNavWidth(navWidth);
      }
    },
    [],
  );

  return themeReady ? (
    // The shell uses vuu-theme in the chrome mode, never the preview theme,
    // which only applies inside the example iframe.
    <SaltProviderNext
      accent="purple"
      density="high"
      corner="rounded"
      theme="vuu-theme"
      mode={chromeMode}
    >
      <ChromeModeContext.Provider value={chromeModeState}>
        <ShowcaseProvider isDataConsumer={dataConsumer}>
          <GridLayoutProvider>
            <GridLayout
              className="ShowcaseShell"
              colsAndRows={colsAndRows}
              data-chrome-mode={chromeMode}
              data-section={section}
              full-page
              id="ShowcaseShell"
              onChange={handleGridLayoutChanged}
            >
              {/* Shell items are locked: no header (so not draggable) and not drop targets */}

              {/* ------ App Header -------*/}
              <GridLayoutItem
                className="ShowcaseShell-header"
                header={false}
                id="app-header"
                style={{
                  gridArea: "1/1/2/3",
                }}
              >
                <ShellTopBar
                  exampleCount={exampleCount}
                  onSearch={focusNavFilter}
                  version={vuuVersion}
                />
              </GridLayoutItem>

              {/* ------ Left Nav -------*/}
              <GridLayoutItem
                className="ShowcaseShell-nav"
                header={false}
                id="palette"
                resizeable="hv"
                style={{
                  gridArea: "2/1/3/2",
                }}
              >
                <ShowcaseNav
                  exampleCount={exampleCount}
                  onSelectExample={handleSelectExample}
                  treeSource={treeSource}
                />
              </GridLayoutItem>

              {/* ------ Content Container -------*/}
              <GridLayoutItem
                className="ShowcaseShell-content"
                header={false}
                id="ContentContainer"
                resizeable="h"
                style={{ gridArea: "2/2/3/3" }}
                title="Showcase Content"
              >
                <ShowcaseContent onSearch={focusNavFilter} treeSource={treeSource} />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutProvider>
        </ShowcaseProvider>
      </ChromeModeContext.Provider>
    </SaltProviderNext>
  ) : null;
};
