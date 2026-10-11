import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { findTreeNode, isIndexNode } from "../shared-utils";
import { ThemeBrowser } from "../theme-browser";
import { ContentToolbar } from "./ContentToolbar";
import { FolderIndex } from "./folder-index";
import { HomePage } from "./home";
import { IFrame } from "./iframe";
import { type NavNodeData, THEME_PATH } from "./tree-nav/nav-tree";

export interface ShowcaseContentProps {
  /** invoked from the home page search field */
  onSearch?: () => void;
  treeSource: TreeSourceNode[];
}

/**
 * Content area of the showcase shell. Examples and docs render in an iframe,
 * below the toolbar that controls theme, density etc. The home page, Theme
 * Browser and folder indexes are built into the shell and render directly,
 * they do not use the toolbar.
 */
export const ShowcaseContent = ({
  onSearch,
  treeSource,
}: ShowcaseContentProps) => {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "");
  const isHomeRoute = path === "";
  const isThemeRoute = path === THEME_PATH;
  const treeNode = useMemo(
    () =>
      isHomeRoute
        ? undefined
        : findTreeNode(pathname, treeSource as TreeSourceNode<NavNodeData>[]),
    [isHomeRoute, pathname, treeSource],
  );
  return (
    <div className="ShowcaseContent">
      {isHomeRoute ? (
        <HomePage onSearch={onSearch} treeSource={treeSource} />
      ) : isThemeRoute ? (
        <ThemeBrowser />
      ) : treeNode && isIndexNode(treeNode) ? (
        <FolderIndex treeNode={treeNode} />
      ) : (
        <>
          <ContentToolbar />
          <div className="ShowcaseContent-main">
            <IFrame />
          </div>
        </>
      )}
    </div>
  );
};
