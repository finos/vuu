import type { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { version as vuuVersion } from "@vuu-ui/vuu-utils/package.json";
import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import { SaltProviderNext } from "@salt-ds/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTargetTreeNode, loadTheme } from "../shared-utils";
import {
  getStoredNavWidth,
  storeNavWidth,
  useChromeMode,
} from "./chrome/chrome-settings";
import { ShowcaseContent } from "./ShowcaseContent";
import { ShowcaseProvider } from "./ShowcaseProvider";
import { TopBar } from "./top-bar";
import {
  buildNavTree,
  countExamples,
  getExampleNodes,
  type NavNodeData,
  navKeyFromPath,
  pathFromNavKey,
} from "./tree-nav/nav-tree";
import { TreeNavPanel } from "./tree-nav/TreeNavPanel";

import "./chrome/chrome.css";
import "./ShowcaseShell.css";

export interface AppProps {
  treeSource: TreeSourceNode[];
}

const focusNavFilter = () => {
  document
    .querySelector<HTMLInputElement>(".ShowcaseShell-nav .vuuTreeNavPanel-search input")
    ?.focus();
};

export const ShowcaseShell = ({ treeSource }: AppProps) => {
  const navigate = useNavigate();
  const initialIsDataConsumer = useMemo(() => {
    const url = new URL(document.location.href);
    const treeNode = getTargetTreeNode(url, treeSource, false) as any;
    return (
      (treeNode && treeNode.nodeData.tags?.includes("data-consumer")) ?? false
    );
  }, [treeSource]);
  const navTree = useMemo(() => buildNavTree(treeSource), [treeSource]);
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
  const { chromeMode, toggleChromeMode } = useChromeMode();

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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { pathname } = useLocation();
  const handleSelect: TableRowSelectHandler = (dataRow) => {
    if (dataRow) {
      const path = pathFromNavKey(dataRow.key);
      if (path !== undefined) {
        setDataConsumer(dataRow.nodeData?.tags?.includes("data-consumer"));
        navigate(path);
      }
    }
  };

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
      <ShowcaseProvider isDataConsumer={dataConsumer}>
        <GridLayoutProvider>
          <GridLayout
            className="ShowcaseShell"
            colsAndRows={colsAndRows}
            data-chrome-mode={chromeMode}
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
              <TopBar
                chromeMode={chromeMode}
                exampleCount={exampleCount}
                onSearch={focusNavFilter}
                onToggleChromeMode={toggleChromeMode}
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
              <TreeNavPanel
                className="ShowcaseNav"
                autoSelectRowKey={navKeyFromPath(pathname)}
                onSelect={handleSelect}
                source={navTree}
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
              <ShowcaseContent treeSource={treeSource} />
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutProvider>
      </ShowcaseProvider>
    </SaltProviderNext>
  ) : null;
};
