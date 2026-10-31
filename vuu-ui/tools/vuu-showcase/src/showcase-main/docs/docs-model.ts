import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { DOCS_ID, type NavNodeData } from "../tree-nav/nav-tree";

type NavNode = TreeSourceNode<NavNodeData>;

const WORDS_PER_MINUTE = 200;

export const isIndexDocument = (documentPath = "") =>
  /(^|\/)[Ii]ndex\.mdx$/.test(documentPath);

export const isDocumentNode = (node?: NavNode) =>
  node?.nodeData?.path?.endsWith(".mdx") === true &&
  typeof node.nodeData.componentName !== "string";

/** Numeric ordering prefixes (e.g "02-") are not part of Showcase routes */
const toRouteSegment = (name: string) => name.replace(/^\d+-/, "");

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "");

/**
 * The route of the folder containing a document. An index document is
 * rendered at the route of its folder, other documents have their own route
 * within the folder.
 */
export const documentFolderRoute = (
  docRoute: string,
  documentPath?: string,
) => {
  const route = trimSlashes(docRoute);
  return isIndexDocument(documentPath)
    ? route
    : route.split("/").slice(0, -1).join("/");
};

/**
 * The route of an example embedded in a document, from the module it was
 * imported from (relative to the document) and its export name, e.g
 * ("/Docs/Table/Columns", ".../02-Columns.mdx", "./02-Columns.examples",
 * "PinnedColumns") => "/Docs/Table/Columns/PinnedColumns"
 */
export const embeddedExampleRoute = (
  docRoute: string,
  documentPath: string | undefined,
  module: string,
  name: string,
) => {
  const segments = documentFolderRoute(docRoute, documentPath)
    .split("/")
    .filter(Boolean);
  const moduleSegments = module.replace(/\.examples$/, "").split("/");
  moduleSegments.forEach((segment, i) => {
    if (segment === "..") {
      segments.pop();
    } else if (segment !== "." && segment !== "") {
      const isFile = i === moduleSegments.length - 1;
      segments.push(isFile ? toRouteSegment(segment) : segment);
    }
  });
  return `/${[...segments, name].join("/")}`;
};

export const readingMinutes = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

/** e.g 2026-10-05 => 5 Oct 2026, dates are formatted as UTC */
export const formatLastUpdated = (date: string, locale = "en-GB") => {
  const time = Date.parse(`${date}T00:00:00Z`);
  return isNaN(time)
    ? date
    : new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      }).format(time);
};

/** All documents under Docs, in reading (nav) order */
export const flattenDocuments = (treeSource: NavNode[]): NavNode[] => {
  const docs = treeSource.find(({ id }) => id === DOCS_ID);
  const documents: NavNode[] = [];
  const visit = (nodes: NavNode[] = []) =>
    nodes.forEach((node) => {
      if (isDocumentNode(node)) {
        documents.push(node);
      }
      visit(node.childNodes as NavNode[] | undefined);
    });
  visit(docs?.childNodes as NavNode[] | undefined);
  return documents;
};

/** The previous and next documents, in reading order */
export const getDocNeighbours = (docRoute: string, treeSource: NavNode[]) => {
  const id = trimSlashes(docRoute);
  const documents = flattenDocuments(treeSource);
  const index = documents.findIndex((node) => node.id === id);
  return {
    next: index === -1 ? undefined : documents[index + 1],
    previous: index > 0 ? documents[index - 1] : undefined,
  };
};

/** Label for a document, chapters are prefixed with their number */
export const documentLabel = ({ label, nodeData }: NavNode) =>
  typeof nodeData?.order === "number"
    ? `${String(nodeData.order).padStart(2, "0")} ${label}`
    : label;
