import { SaltProviderNext } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import {
  type ExhibitImporter,
  findTreeNode,
  loadTheme,
} from "../../shared-utils";
import { useChromeMode } from "../chrome/chrome-settings";
import { ChromeModeContext } from "../chrome/ChromeModeContext";
import { ShowcaseProvider } from "../ShowcaseProvider";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { DocsPage } from "./DocsPage";

import "../chrome/chrome.css";
import "../chrome/controls.css";

type NavNode = TreeSourceNode<NavNodeData>;

const StandaloneDocument = ({ treeSource }: { treeSource: NavNode[] }) => {
  const { pathname } = useLocation();
  const treeNode = useMemo(
    () => findTreeNode(pathname, treeSource),
    [pathname, treeSource],
  );
  return treeNode ? (
    <DocsPage standalone treeNode={treeNode} treeSource={treeSource} />
  ) : null;
};

export interface DocsStandaloneProps {
  importExhibit?: ExhibitImporter;
  treeSource: TreeSourceNode[];
}

/**
 * A document in its own window, rendered in the showcase chrome. Preview
 * settings, for the examples embedded in the document, are url params.
 */
export const DocsStandalone = ({
  importExhibit,
  treeSource,
}: DocsStandaloneProps) => {
  const chromeModeState = useChromeMode();
  const { chromeMode } = chromeModeState;
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    loadTheme("vuu-theme").then(() => setThemeReady(true));
  }, []);

  return themeReady ? (
    <BrowserRouter>
      <SaltProviderNext
        accent="purple"
        corner="rounded"
        density="high"
        mode={chromeMode}
        theme="vuu-theme"
      >
        <ChromeModeContext.Provider value={chromeModeState}>
          <ShowcaseProvider importExhibit={importExhibit}>
            <div
              className="ShowcaseChrome ShowcaseDocsStandalone"
              data-chrome-mode={chromeMode}
            >
              <StandaloneDocument treeSource={treeSource as NavNode[]} />
            </div>
          </ShowcaseProvider>
        </ChromeModeContext.Provider>
      </SaltProviderNext>
    </BrowserRouter>
  ) : null;
};
