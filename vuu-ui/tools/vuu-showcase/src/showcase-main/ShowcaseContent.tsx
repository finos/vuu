import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  findTreeNode,
  isComponentDescriptor,
  isIndexNode,
} from "../shared-utils";
import { ThemeBrowser } from "../theme-browser";
import { DocsPage } from "./docs";
import { ExamplePage } from "./example";
import { FolderIndex } from "./folder-index";
import { HomePage } from "./home";
import { type NavNodeData, THEME_PATH } from "./tree-nav/nav-tree";

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
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
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
    </div>
  );
};
