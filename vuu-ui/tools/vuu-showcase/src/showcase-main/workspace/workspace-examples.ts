import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { getExampleNodes, type NavNodeData } from "../tree-nav/nav-tree";
import { isWorkspaceExample } from "./workspace-model";

export interface WorkspaceExample {
  /** labels of the folders containing the example, e.g Filters › Filter bar */
  folder: string;
  /** route of the example */
  path: string;
  title: string;
}

/** All examples that can be added to a workspace, in tree order */
export const collectWorkspaceExamples = (
  treeSource: TreeSourceNode<NavNodeData>[],
) => {
  const examples: WorkspaceExample[] = [];
  const visit = (nodes: TreeSourceNode<NavNodeData>[], folders: string[]) => {
    for (const node of nodes) {
      if (node.childNodes?.length) {
        visit(node.childNodes, folders.concat(node.label));
      } else if (isWorkspaceExample(node.nodeData)) {
        examples.push({
          folder: folders.join(" › "),
          path: `/${node.id}`,
          title: node.label,
        });
      }
    }
  };
  visit(getExampleNodes(treeSource), []);
  return examples;
};

/** Examples whose title or folder contain every word of the query */
export const filterWorkspaceExamples = (
  examples: WorkspaceExample[],
  query: string,
) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length === 0
    ? examples
    : examples.filter(({ folder, title }) => {
        const text = `${title} ${folder}`.toLowerCase();
        return words.every((word) => text.includes(word));
      });
};
