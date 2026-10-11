import type { TreeSourceNode } from "@vuu-ui/vuu-utils";

export const DOCS_ID = "Docs";
export const THEME_ID = "Theme";
export const EXAMPLES_ID = "Examples";

export const THEME_PATH = `/${THEME_ID}`;

const ROOT_KEY = "$root";
const EXAMPLES_KEY = `${ROOT_KEY}|${EXAMPLES_ID}`;

export type NavNodeData = {
  componentName?: string;
  count?: number;
  description?: string;
  live?: boolean;
  path?: string;
  route?: string;
  sourceRange?: [number, number];
  tags?: string[];
};

/**
 * Builds the showcase navigation tree from the example tree source. Docs and
 * Theme are promoted to the top level, every other example is grouped under
 * Examples. Grouping is purely presentational, example urls are unchanged.
 */
export const buildNavTree = (
  treeSource: TreeSourceNode[],
): TreeSourceNode[] => {
  const docs = treeSource.find((node) => node.id === DOCS_ID);
  const examples = treeSource.filter((node) => node !== docs);
  const navTree: TreeSourceNode[] = [];
  if (docs) {
    navTree.push(docs);
  }
  navTree.push(
    {
      id: THEME_ID,
      icon: "palette",
      label: THEME_ID,
      nodeData: { route: THEME_PATH } as NavNodeData,
    },
    {
      id: EXAMPLES_ID,
      icon: "folder",
      label: EXAMPLES_ID,
      childNodes: examples,
      expanded: true,
    },
  );
  return navTree;
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

/** Maps a url pathname to the key of the corresponding nav tree row */
export const navKeyFromPath = (pathname: string) => {
  const path = pathname.replace(/\/$/, "");
  if (path === "") {
    return undefined;
  } else if (path === THEME_PATH || isDocsPath(path)) {
    return `${ROOT_KEY}${path.split("/").join("|")}`;
  } else {
    return `${EXAMPLES_KEY}${path.split("/").join("|")}`;
  }
};

/**
 * Maps a nav tree row key to a url pathname. Returns undefined for the
 * Examples group itself, which has no route of its own.
 */
export const pathFromNavKey = (key: string) => {
  if (key === EXAMPLES_KEY) {
    return undefined;
  }
  const routeKey = key.startsWith(`${EXAMPLES_KEY}|`)
    ? `${ROOT_KEY}${key.slice(EXAMPLES_KEY.length)}`
    : key;
  return `/${routeKey
    .slice(ROOT_KEY.length + 1)
    .split("|")
    .join("/")}`;
};
