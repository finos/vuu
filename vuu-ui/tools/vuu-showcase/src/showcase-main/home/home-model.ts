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

export interface AddedPageRef extends PageRef {
  /** date (yyyy-mm-dd) the example was added */
  added: string;
}

/**
 * The most recently added examples, newest first. Examples added on the same
 * date retain their tree order.
 */
export const getRecentlyAdded = (
  treeSource: NavNode[],
  limit: number,
): AddedPageRef[] => {
  const examples: AddedPageRef[] = [];
  const visit = (nodes: NavNode[], trail: string[]) => {
    for (const node of nodes) {
      if (node.childNodes?.length) {
        visit(node.childNodes, trail.concat(node.label));
      } else if (isExample(node) && node.nodeData?.added) {
        examples.push({
          added: node.nodeData.added,
          label: node.label,
          live: node.nodeData.live,
          path: `/${node.id}`,
          trail,
        });
      }
    }
  };
  visit(getExampleNodes(treeSource), []);
  return examples
    .sort((e1, e2) => e2.added.localeCompare(e1.added))
    .slice(0, limit);
};

/** Recently viewed paths resolved to pages, unknown paths are dropped */
export const resolveRecent = (
  recent: string[],
  pageIndex: Map<string, PageRef>,
) =>
  recent
    .map((path) => pageIndex.get(path))
    .filter((page): page is PageRef => page !== undefined);
