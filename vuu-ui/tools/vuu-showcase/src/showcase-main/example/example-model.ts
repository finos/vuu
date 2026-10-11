import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { findTreeNode } from "../../shared-utils";
import {
  buildSectionTree,
  DOCS_ID,
  type NavNodeData,
  sectionFromPath,
} from "../tree-nav/nav-tree";

type NavNode = TreeSourceNode<NavNodeData>;

export const GITHUB_SOURCE_URL =
  "https://github.com/finos/vuu/blob/main/vuu-ui/showcase";

export interface Crumb {
  label: string;
  path: string;
}

export const routeOf = (node: NavNode) => `/${node.id}`;

const isExample = (node: NavNode) =>
  typeof node.nodeData?.componentName === "string";

/** Examples in the order they are presented in the nav */
export const flattenExamples = (nodes: NavNode[]): NavNode[] =>
  nodes.flatMap((node) =>
    node.childNodes?.length
      ? flattenExamples(node.childNodes as NavNode[])
      : isExample(node)
        ? [node]
        : [],
  );

/** The examples before and after the example at pathname, in nav order */
export const getAdjacentExamples = (
  pathname: string,
  treeSource: NavNode[],
) => {
  const examples = flattenExamples(
    buildSectionTree(sectionFromPath(pathname), treeSource),
  );
  const id = pathname.replace(/^\/|\/$/g, "");
  const index = examples.findIndex((node) => node.id === id);
  return {
    next: index === -1 ? undefined : examples[index + 1],
    previous: index > 0 ? examples[index - 1] : undefined,
  };
};

/**
 * Breadcrumb trail for a route, excluding the target node itself. The first
 * crumb is the section, Examples (which is the home page) or Docs. When the
 * route was opened from another page (navFrom), e.g an example opened from
 * the document that embeds it, the trail leads to that page instead.
 */
export const getBreadcrumbs = (
  pathname: string,
  treeSource: NavNode[],
  navFrom?: string,
): Crumb[] => {
  if (navFrom !== undefined) {
    const from = navFrom.replace(/\/$/, "");
    const crumbs = getBreadcrumbs(from, treeSource);
    if (crumbs.some(({ path }) => path === from)) {
      return crumbs;
    }
    const node = findTreeNode(from, treeSource);
    return crumbs.concat({
      label: node?.label ?? from.split("/").pop() ?? from,
      path: from,
    });
  }
  const segments = pathname.replace(/^\/|\/$/g, "").split("/");
  const isDocs = segments[0] === DOCS_ID;
  const crumbs: Crumb[] = [
    isDocs
      ? { label: "Docs", path: `/${DOCS_ID}` }
      : { label: "Examples", path: "/" },
  ];
  for (let i = isDocs ? 2 : 1; i < segments.length; i++) {
    const path = `/${segments.slice(0, i).join("/")}`;
    const node = findTreeNode(path, treeSource);
    crumbs.push({ label: node?.label ?? segments[i - 1], path });
  }
  return crumbs;
};

/** The parent of a node, e.g the examples file of an example */
export const getParentNode = (pathname: string, treeSource: NavNode[]) => {
  const segments = pathname.replace(/^\/|\/$/g, "").split("/");
  return segments.length > 1
    ? findTreeNode(`/${segments.slice(0, -1).join("/")}`, treeSource)
    : undefined;
};

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "");

const relativePath = (path: string) => path.replace(/^\.\//, "");

/**
 * Links to the source of an example. A local VS Code link is available only
 * in the dev server, where the location of the source is known.
 */
export const getSourceLinks = (
  { path, sourceRange }: NavNodeData,
  sourceRoot = "",
) => {
  if (!path) {
    return {};
  }
  const file = relativePath(path);
  const [start, end] = sourceRange ?? [];
  const lines = start ? `#L${start}${end ? `-L${end}` : ""}` : "";
  return {
    github: `${GITHUB_SOURCE_URL}/${file}${lines}`,
    vscode: sourceRoot
      ? `vscode://file/${trimSlashes(sourceRoot)}/${file}${start ? `:${start}` : ""}`
      : undefined,
  };
};

/**
 * Examples related to the example at pathname: the other examples in its
 * examples file and the documents, other than its own, that embed it.
 */
export const getRelated = (pathname: string, treeSource: NavNode[]) => {
  const id = pathname.replace(/^\/|\/$/g, "");
  const example = findTreeNode(pathname, treeSource) as NavNode | undefined;
  const parent = getParentNode(pathname, treeSource) as NavNode | undefined;
  const siblings = ((parent?.childNodes ?? []) as NavNode[]).filter(
    (node) => node.id !== id && isExample(node),
  );
  const docs = (example?.nodeData?.docs ?? [])
    .map((docId) => findTreeNode(`/${docId}`, treeSource) as NavNode)
    .filter((node): node is NavNode => node !== undefined);
  return { docs, siblings };
};
