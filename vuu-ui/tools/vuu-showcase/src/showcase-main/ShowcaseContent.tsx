import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { findTreeNode, isIndexNode } from "../shared-utils";
import { ThemeBrowser } from "../theme-browser";
import { ContentToolbar } from "./ContentToolbar";
import { FolderIndex } from "./folder-index";
import { IFrame } from "./iframe";
import { type NavNodeData, THEME_PATH } from "./tree-nav/nav-tree";

export interface ShowcaseContentProps {
  treeSource: TreeSourceNode[];
}

/**
 * Content area of the showcase shell. Examples and docs render in an iframe,
 * below the toolbar that controls theme, density etc. The Theme Browser and
 * folder indexes are built into the shell and render directly, they do not
 * use the toolbar.
 */
export const ShowcaseContent = ({ treeSource }: ShowcaseContentProps) => {
  const { pathname } = useLocation();
  const isThemeRoute = pathname.replace(/\/$/, "") === THEME_PATH;
  const treeNode = useMemo(
    () => findTreeNode(pathname, treeSource as TreeSourceNode<NavNodeData>[]),
    [pathname, treeSource],
  );
  return (
    <div className="ShowcaseContent">
      {isThemeRoute ? (
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
