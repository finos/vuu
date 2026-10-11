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
import { useLocation } from "react-router-dom";
import { type ExhibitImporter, loadTheme } from "../shared-utils";
import {
  getStoredNavWidth,
  storeNavWidth,
  useChromeMode,
} from "./chrome/chrome-settings";
import {
  ChromeModeContext,
  useChromeModeContext,
} from "./chrome/ChromeModeContext";
import { CommandPalette, OPEN_PALETTE_MESSAGE } from "./command-palette";
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
import "./chrome/controls.css";
import "./ShowcaseShell.css";

export interface AppProps {
  /** loads mdx documents, which render in the shell */
  importExhibit?: ExhibitImporter;
  treeSource: TreeSourceNode[];
}

const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT");

/**
 * GridLayout does not re-render its items when their props change, so state
 * is passed to the TopBar via context.
 */
const ShellTopBar = (
  props: Omit<TopBarProps, "chromeMode" | "onToggleChromeMode">,
) => {
  const { chromeMode, toggleChromeMode } = useChromeModeContext();
  return (
    <TopBar
      {...props}
      chromeMode={chromeMode}
      onToggleChromeMode={toggleChromeMode}
    />
  );
};

export const ShowcaseShell = ({ importExhibit, treeSource }: AppProps) => {
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
  const chromeModeState = useChromeMode();
  const { chromeMode, toggleChromeMode } = chromeModeState;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    loadTheme("vuu-theme").then(() => {
      setThemeReady(true);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "k") {
        evt.preventDefault();
        setPaletteOpen((open) => !open);
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
    // examples run in a same origin iframe, which forwards mod+K
    const handleMessage = (evt: MessageEvent) => {
      if (
        evt.origin === window.location.origin &&
        evt.data?.type === OPEN_PALETTE_MESSAGE
      ) {
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const { pathname } = useLocation();
  const section = sectionFromPath(pathname);
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
        <ShowcaseProvider importExhibit={importExhibit}>
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
                  onSearch={openPalette}
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
                <ShowcaseContent
                  onSearch={openPalette}
                  treeSource={treeSource}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutProvider>
          <CommandPalette
            chromeMode={chromeMode}
            onClose={closePalette}
            onToggleChromeMode={toggleChromeMode}
            open={paletteOpen}
            treeSource={treeSource}
          />
        </ShowcaseProvider>
      </ChromeModeContext.Provider>
    </SaltProviderNext>
  ) : null;
};
