import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  findTreeNode,
  isComponentDescriptor,
  isIndexNode,
} from "../shared-utils";
import { ThemeBrowser } from "../theme-browser";
import { DocTabStrip, useDocTabsRouting, useTabbedDocuments } from "./doc-tabs";
import { DocsPage } from "./docs";
import { ExamplePage } from "./example";
import { FolderIndex } from "./folder-index";
import { HomePage } from "./home";
import { ToastHost } from "./toast";
import { type NavNodeData, THEME_PATH } from "./tree-nav/nav-tree";
import { WorkspacePage, workspaceIdFromPath } from "./workspace";

export interface ShowcaseContentProps {
  /** invoked from the home page search field */
  onSearch?: () => void;
  treeSource: TreeSourceNode[];
}

/**
 * Content area of the showcase shell. Examples render in an iframe, below the
 * preview bar that controls theme, density etc. Docs, the home page, Theme
 * Browser and folder indexes are built into the shell and render directly.
 */
export const ShowcaseContent = ({
  onSearch,
  treeSource,
}: ShowcaseContentProps) => {
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const path = pathname.replace(/\/$/, "");
  const isHomeRoute = path === "";
  const isThemeRoute = path === THEME_PATH;
  const isWorkspaceRoute = workspaceIdFromPath(path) !== undefined;
  const treeNode = useMemo(
    () =>
      isHomeRoute || isWorkspaceRoute
        ? undefined
        : findTreeNode(pathname, treeSource as TreeSourceNode<NavNodeData>[]),
    [isHomeRoute, isWorkspaceRoute, pathname, treeSource],
  );
  const isDocument = useDocTabsRouting({
    path,
    search,
    treeSource: treeSource as TreeSourceNode<NavNodeData>[],
  });
  const tabbed = useTabbedDocuments();
  return (
    <div className="ShowcaseContent">
      {isDocument && tabbed ? (
        <DocTabStrip treeSource={treeSource as TreeSourceNode<NavNodeData>[]} />
      ) : null}
      {isHomeRoute ? (
        <HomePage onSearch={onSearch} treeSource={treeSource} />
      ) : isWorkspaceRoute ? (
        <WorkspacePage
          treeSource={treeSource as TreeSourceNode<NavNodeData>[]}
        />
      ) : isThemeRoute ? (
        <ThemeBrowser token={searchParams.get("token") ?? undefined} />
      ) : treeNode && isIndexNode(treeNode) ? (
        <FolderIndex treeNode={treeNode} />
      ) : treeNode && isComponentDescriptor(treeNode.nodeData) ? (
        <ExamplePage
          treeNode={treeNode}
          treeSource={treeSource as TreeSourceNode<NavNodeData>[]}
        />
      ) : treeNode ? (
        <DocsPage
          treeNode={treeNode}
          treeSource={treeSource as TreeSourceNode<NavNodeData>[]}
        />
      ) : null}
      <ToastHost />
    </div>
  );
};
