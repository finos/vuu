import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useEffect } from "react";
import { findTreeNode, isComponentDescriptor } from "../../shared-utils";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { workspaceIdFromPath } from "../workspace/workspace-model";
import { useWorkspaces } from "../workspace/workspace-store";
import { docTabsStore } from "./doc-tabs-store";

/** A document is an example or a workspace, anything that can open in a tab */
export const isDocumentPath = (
  path: string,
  treeSource: TreeSourceNode<NavNodeData>[],
  workspaceIds: Set<string>,
) => {
  const workspaceId = workspaceIdFromPath(path);
  if (workspaceId !== undefined) {
    return workspaceIds.has(workspaceId);
  }
  const treeNode = path ? findTreeNode(path, treeSource) : undefined;
  return treeNode !== undefined && isComponentDescriptor(treeNode.nodeData);
};

/**
 * Keeps the open tabs in step with the url. The url is the source of truth,
 * the document it shows is the active tab. Tabs whose document no longer
 * exists (a deleted workspace, a renamed example) are dropped.
 */
export const useDocTabsRouting = ({
  path,
  search,
  treeSource,
}: {
  path: string;
  search: string;
  treeSource: TreeSourceNode<NavNodeData>[];
}) => {
  const workspaces = useWorkspaces();
  const isDocument = isDocumentPath(
    path,
    treeSource,
    new Set(workspaces.map(({ id }) => id)),
  );

  useEffect(() => {
    const workspaceIds = new Set(workspaces.map(({ id }) => id));
    docTabsStore.prune((p) => isDocumentPath(p, treeSource, workspaceIds));
  }, [treeSource, workspaces]);

  useEffect(() => {
    if (isDocument) {
      docTabsStore.show(path, search);
    } else {
      docTabsStore.markSynced();
    }
  }, [isDocument, path, search]);

  return isDocument;
};
