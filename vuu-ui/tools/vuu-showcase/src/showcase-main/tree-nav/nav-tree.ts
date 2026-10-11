import type { TreeSourceNode } from "@vuu-ui/vuu-utils";

export const DOCS_ID = "Docs";
export const THEME_ID = "Theme";
export const EXAMPLES_ID = "Examples";

export const THEME_PATH = `/${THEME_ID}`;

export type NavNodeData = {
  componentName?: string;
  count?: number;
  description?: string;
  /** routes of documents that embed this example */
  docs?: string[];
  /** a presentational grouping node, has no route */
  heading?: boolean;
  /** documents only, date (yyyy-mm-dd) of the last commit */
  lastUpdated?: string;
  live?: boolean;
  /** numeric ordering prefix, e.g 2 for 02-Columns.mdx, shown for chapters */
  order?: number;
  path?: string;
  route?: string;
  sourceRange?: [number, number];
  tags?: string[];
};

const isDocsPath = (pathname: string) =>
  pathname === `/${DOCS_ID}` || pathname.startsWith(`/${DOCS_ID}/`);

export type ShowcaseSection = "docs" | "examples" | "theme";

/** The top level section of the showcase a url pathname belongs to */
export const sectionFromPath = (pathname: string): ShowcaseSection => {
  const path = pathname.replace(/\/$/, "");
  if (path === THEME_PATH) {
    return "theme";
  } else if (isDocsPath(path)) {
    return "docs";
  } else {
    return "examples";
  }
};

/** The example nodes of the tree source, i.e everything except Docs */
export const getExampleNodes = <T = NavNodeData>(
  treeSource: TreeSourceNode<T>[],
) => treeSource.filter((node) => node.id !== DOCS_ID);

/** Total number of examples in a list of nodes, using the folder counts */
export const countExamples = (nodes: TreeSourceNode<NavNodeData>[]) =>
  nodes.reduce((count, { childNodes, nodeData }) => {
    if (childNodes?.length) {
      return count + (nodeData?.count ?? 0);
    } else if (typeof nodeData?.componentName === "string") {
      return count + 1;
    }
    return count;
  }, 0);

/**
 * A synthetic node that groups all examples, so the examples root can be
 * presented like any other folder.
 */
export const buildExamplesIndexNode = (
  treeSource: TreeSourceNode<NavNodeData>[],
): TreeSourceNode<NavNodeData> => {
  const childNodes = getExampleNodes(treeSource);
  return {
    childNodes,
    id: EXAMPLES_ID,
    label: EXAMPLES_ID,
    nodeData: {
      count: countExamples(childNodes),
      live: childNodes.some(({ nodeData }) => nodeData?.live),
    },
  };
};

export const GETTING_STARTED_LABEL = "Getting started";
export const COMPONENTS_LABEL = "Components";

const isDocument = ({ nodeData }: TreeSourceNode<NavNodeData>) =>
  nodeData?.path?.endsWith(".mdx") === true;

const isExampleNode = ({ nodeData }: TreeSourceNode<NavNodeData>) =>
  typeof nodeData?.componentName === "string";

/**
 * Docs nav: a chapter (a document with examples) is a page, its examples are
 * listed on the page itself. Numbered chapters are shown with their number in
 * place of an icon. Folders are expanded.
 */
const toDocsNavNode = (
  node: TreeSourceNode<NavNodeData>,
): TreeSourceNode<NavNodeData> => {
  const { childNodes = [] } = node;
  const isChapter =
    isDocument(node) &&
    childNodes.length > 0 &&
    childNodes.every(isExampleNode);
  const icon = node.nodeData?.order === undefined ? node.icon : undefined;
  if (isChapter || childNodes.length === 0) {
    return { ...node, childNodes: undefined, icon };
  }
  return {
    ...node,
    childNodes: childNodes.map(toDocsNavNode),
    expanded: true,
    icon,
  };
};

const byLabel = (n1: TreeSourceNode, n2: TreeSourceNode) =>
  n1.label.localeCompare(n2.label);

/**
 * Builds the sidebar tree for a showcase section. Examples are presented
 * under two headings, standalone pages under Getting started and component
 * folders under Components. Docs presents the content of the Docs folder.
 * The Theme section has no nav tree. Grouping is purely presentational,
 * example urls are unchanged.
 */
export const buildSectionTree = (
  section: ShowcaseSection,
  treeSource: TreeSourceNode<NavNodeData>[],
): TreeSourceNode<NavNodeData>[] => {
  if (section === "docs") {
    const docs = treeSource.find((node) => node.id === DOCS_ID);
    return (docs?.childNodes ?? []).map(toDocsNavNode);
  } else if (section === "examples") {
    const examples = getExampleNodes(treeSource);
    const pages = examples.filter((node) => !node.childNodes?.length);
    const folders = examples
      .filter((node) => node.childNodes?.length)
      .sort(byLabel);
    const sectionTree: TreeSourceNode<NavNodeData>[] = [];
    if (pages.length > 0) {
      sectionTree.push({
        childNodes: pages,
        expanded: true,
        id: "$heading/getting-started",
        label: GETTING_STARTED_LABEL,
        nodeData: { heading: true },
      });
    }
    if (folders.length > 0) {
      sectionTree.push({
        childNodes: folders,
        expanded: true,
        id: "$heading/components",
        label: COMPONENTS_LABEL,
        nodeData: { count: folders.length, heading: true },
      });
    }
    return sectionTree;
  } else {
    return [];
  }
};

const ROOT_KEY = "$root";

export interface NavIndex {
  /** true if pathname is a page (not a folder) in the nav tree */
  isPagePath: (pathname: string) => boolean;
  /** The nav tree row key for a url pathname, if that route is in the tree */
  keyForPath: (pathname: string) => string | undefined;
  /**
   * The row key for a pathname or, if that route is not in the tree, its
   * nearest ancestor, e.g the chapter of an example embedded in a document.
   */
  keyForNearestPath: (pathname: string) => string | undefined;
  /** The url pathname for a nav tree row key, undefined for headings */
  pathForKey: (key: string) => string | undefined;
}

/**
 * Maps between url pathnames and the row keys of a nav tree. Row keys are
 * assigned by TreeDataSource from the keySegment (or label) of each node,
 * pathnames are derived from node ids.
 */
export const createNavIndex = (tree: TreeSourceNode<NavNodeData>[]) => {
  const keyToPath = new Map<string, string>();
  const pathToKey = new Map<string, string>();
  const pagePaths = new Set<string>();
  const visit = (nodes: TreeSourceNode<NavNodeData>[], keyBase: string) => {
    for (const node of nodes) {
      const key = `${keyBase}|${node.keySegment ?? node.label}`;
      if (!node.nodeData?.heading) {
        const path = `/${node.id}`;
        keyToPath.set(key, path);
        pathToKey.set(path, key);
        if (!node.childNodes?.length) {
          pagePaths.add(path);
        }
      }
      if (node.childNodes) {
        visit(node.childNodes, key);
      }
    }
  };
  visit(tree, ROOT_KEY);
  const normalise = (pathname: string) => pathname.replace(/(.)\/$/, "$1");
  return {
    isPagePath: (pathname) => pagePaths.has(normalise(pathname)),
    keyForPath: (pathname) => pathToKey.get(normalise(pathname)),
    keyForNearestPath: (pathname) => {
      const segments = normalise(pathname).split("/");
      for (let i = segments.length; i > 1; i--) {
        const key = pathToKey.get(segments.slice(0, i).join("/"));
        if (key) return key;
      }
    },
    pathForKey: (key) => keyToPath.get(key),
  } as NavIndex;
};
