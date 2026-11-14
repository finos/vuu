import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import {
  countExamples,
  DOCS_ID,
  getExampleNodes,
  type NavNodeData,
} from "../tree-nav/nav-tree";

type NavNode = TreeSourceNode<NavNodeData>;

export interface PageRef {
  label: string;
  path: string;
  /** labels of ancestors, outermost first */
  trail: string[];
  live?: boolean;
}

export interface HomeStats {
  docChapters: number;
  docGuides: number;
  examples: number;
  liveExamples: number;
}

const isExample = (node: NavNode) =>
  !node.childNodes?.length && typeof node.nodeData?.componentName === "string";

const visitLeaves = (
  nodes: NavNode[],
  visit: (node: NavNode) => void,
): void => {
  for (const node of nodes) {
    if (node.childNodes?.length) {
      visitLeaves(node.childNodes, visit);
    } else {
      visit(node);
    }
  }
};

const countLiveExamples = (nodes: NavNode[]) => {
  let count = 0;
  visitLeaves(nodes, (node) => {
    if (isExample(node) && node.nodeData?.live) {
      count += 1;
    }
  });
  return count;
};

/**
 * Maps every route in the tree to its label and ancestor labels, used to
 * present recently viewed pages.
 */
export const createPageIndex = (treeSource: NavNode[]) => {
  const index = new Map<string, PageRef>();
  const visit = (nodes: NavNode[], trail: string[]) => {
    for (const node of nodes) {
      const path = `/${node.id}`;
      index.set(path, {
        label: node.label,
        live: node.nodeData?.live,
        path,
        trail,
      });
      if (node.childNodes) {
        visit(node.childNodes, trail.concat(node.label));
      }
    }
  };
  visit(treeSource, []);
  return index;
};

const getDocGuides = (treeSource: NavNode[]) =>
  (treeSource.find(({ id }) => id === DOCS_ID)?.childNodes ?? []).filter(
    (node) => node.childNodes?.length,
  );

export const getHomeStats = (treeSource: NavNode[]): HomeStats => {
  const exampleNodes = getExampleNodes(treeSource);
  const guides = getDocGuides(treeSource);
  return {
    docChapters: guides.reduce(
      (count, guide) => count + (guide.childNodes?.length ?? 0),
      0,
    ),
    docGuides: guides.length,
    examples: countExamples(exampleNodes),
    liveExamples: countLiveExamples(exampleNodes),
  };
};

/** Recently viewed paths resolved to pages, unknown paths are dropped */
export const resolveRecent = (
  recent: string[],
  pageIndex: Map<string, PageRef>,
) =>
  recent
    .map((path) => pageIndex.get(path))
    .filter((page): page is PageRef => page !== undefined);
