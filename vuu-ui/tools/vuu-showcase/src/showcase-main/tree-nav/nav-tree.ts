import type { TreeSourceNode } from "@vuu-ui/vuu-utils";

export const DOCS_ID = "Docs";
export const THEME_ID = "Theme";
export const EXAMPLES_ID = "Examples";

export const THEME_PATH = `/${THEME_ID}`;

const ROOT_KEY = "$root";
const EXAMPLES_KEY = `${ROOT_KEY}|${EXAMPLES_ID}`;

export type NavNodeData = { route?: string; tags?: string[] };

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
