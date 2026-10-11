import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { parseExampleExports } from "./example-exports";
import { humanise } from "./humanise";

export const dropLastPathSegment = (path: string, separator = "/") => {
  return path.slice(0, path.lastIndexOf(separator));
};

// A numeric prefix e.g "01-" can be used to control ordering. It is not
// displayed and is not part of the route (as with Docusaurus).
const toRouteSegment = (name: string) => name.replace(/^\d+-/, "");

const getDocumentPath = (
  dirFiles: Set<string>,
  fileName: string,
): string | undefined => {
  const fileRoot = fileName.split(".").slice(0, -2).join();
  if (dirFiles.has(`${fileRoot}.mdx`)) {
    return `${fileRoot}.mdx`;
  }
};

export type NodeData = {
  componentName?: string;
  /** folders only, number of examples within */
  count?: number;
  description?: string;
  /** examples only, routes of documents (other than its own) that embed it */
  docs?: string[];
  /** true for an example that consumes data, or a folder containing one */
  live?: boolean;
  /** documents only, date (yyyy-mm-dd) of the last commit to the document */
  lastUpdated?: string;
  name?: string;
  /** the numeric ordering prefix of the file, if any, e.g 2 for 02-Columns */
  order?: number;
  path?: string;
  /** examples only, the example declares editable props */
  props?: boolean;
  /** examples only, 1-based inclusive line range within the examples file */
  sourceRange?: [number, number];
  tags?: string[];
};

/**
 * Builds the showcase tree from the examples folder. Node ids (and hence
 * routes) and keySegments are derived from file and export names, labels are
 * humanised versions of the same names, for display only.
 */
export const treeSourceFromFileSystem = (
  exhibitsPath: string,
  route = "",
  icon = "folder",
  tags = new Set<string>(),
): [TreeSourceNode<NodeData>[], string[], string | undefined] => {
  const [treeSourceNodes, tagList, documentPath] = buildTreeSource(
    exhibitsPath,
    route,
    icon,
    tags,
  );
  if (route === "") {
    addFolderSummaries(treeSourceNodes);
    addDocReferences(treeSourceNodes);
  }
  return [treeSourceNodes, tagList, documentPath];
};

const buildTreeSource = (
  exhibitsPath: string,
  route: string,
  icon: string,
  tags: Set<string>,
): [TreeSourceNode<NodeData>[], string[], string | undefined] => {
  const treeSourceNodes: TreeSourceNode<NodeData>[] = [];
  let documentPath: string | undefined;
  const dirFiles = new Set<string>();

  // First store all directory file name in a set so we can check membership of related files
  // as we process
  fs.readdirSync(exhibitsPath).forEach((fileName) => {
    dirFiles.add(fileName);
  });

  dirFiles.forEach((fileName) => {
    const filePath = path.join(exhibitsPath, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const segment = toRouteSegment(fileName);
      const [childNodes, , documentPath] = buildTreeSource(
        filePath,
        `${route}${segment}/`,
        "box",
        tags,
      );
      const treeSourceNode: TreeSourceNode<NodeData> = {
        id: `${route}${segment}`,
        // a folder with an Index.mdx displays that document
        icon: documentPath ? "document" : icon,
        keySegment: segment,
        label: humanise(fileName),
        childNodes,
      };
      if (documentPath) {
        treeSourceNode.nodeData = {
          name: fileName,
          ...documentData(documentPath),
        };
      }
      if (Array.isArray(childNodes) && childNodes.length > 0) {
        treeSourceNodes.push(treeSourceNode);
      }
    } else if (fileName.match(/examples.tsx$/)) {
      const name = dropLastPathSegment(dropLastPathSegment(fileName, "."), ".");
      const segment = toRouteSegment(name);
      const id = `${route}${segment}`;

      const documentPath = getDocumentPath(dirFiles, fileName);
      const treeSourceNode: TreeSourceNode<NodeData> = {
        id,
        // examples with an accompanying mdx document display the document
        icon: documentPath ? "document" : "box",
        keySegment: segment,
        label: humanise(name),
        childNodes: treeSourceFromExportedComponents(
          exhibitsPath,
          `${id}/`,
          fileName,
          tags,
        ),
      };

      if (documentPath) {
        treeSourceNode.nodeData = treeSourceFromDocument(
          exhibitsPath,
          documentPath,
        );
      }

      treeSourceNodes.push(treeSourceNode);
    } else if (fileName.match(/^[Ii]ndex.mdx$/)) {
      documentPath = `${exhibitsPath}/${fileName}`;
    } else if (fileName.match(/\.mdx$/)) {
      const name = dropLastPathSegment(fileName, ".");
      // mdx files with a matching examples file are rendered as the document
      // for that examples node (see above), standalone mdx files are leaf nodes
      if (!dirFiles.has(`${name}.examples.tsx`)) {
        const segment = toRouteSegment(name);
        treeSourceNodes.push({
          id: `${route}${segment}`,
          icon: "document",
          keySegment: segment,
          label: humanise(name),
          nodeData: {
            name,
            ...treeSourceFromDocument(exhibitsPath, fileName),
          },
        });
      }
    }
  });
  return [treeSourceNodes, Array.from(tags), documentPath];
};

/** Date of the last commit to a file, undefined if not committed */
const gitLastUpdated = (filePath: string) => {
  try {
    const date = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", path.basename(filePath)],
      { cwd: path.dirname(filePath), encoding: "utf8", stdio: "pipe" },
    ).trim();
    return date || undefined;
  } catch {
    return undefined;
  }
};

const documentData = (documentPath: string): NodeData => {
  const nodeData: NodeData = { path: documentPath };
  const lastUpdated = gitLastUpdated(documentPath);
  if (lastUpdated) {
    nodeData.lastUpdated = lastUpdated;
  }
  const order = path.basename(documentPath).match(/^(\d+)-/)?.[1];
  if (order) {
    nodeData.order = parseInt(order, 10);
  }
  return nodeData;
};

// The .mdx extension identifies the node as a document.
const treeSourceFromDocument = (
  exhibitsPath: string,
  fileName: string,
): NodeData => documentData(`${exhibitsPath}/${fileName}`);

const treeSourceFromExportedComponents = (
  exhibitsPath: string,
  route: string,
  fileName: string,
  tagsList: Set<string>,
): TreeSourceNode<NodeData>[] => {
  const filePath = path.join(exhibitsPath, fileName);
  const text = fs.readFileSync(filePath).toString();
  return parseExampleExports(fileName, text).map(
    ({ componentName, description, hasProps, sourceRange, tags, title }) => {
      tags?.forEach((tag) => tagsList.add(tag));
      const nodeData: NodeData = {
        componentName,
        path: `${exhibitsPath}/${fileName}`,
        sourceRange,
        tags,
      };
      if (description) {
        nodeData.description = description;
      }
      if (hasProps) {
        nodeData.props = true;
      }
      if (tags?.includes("data-consumer")) {
        nodeData.live = true;
      }
      return {
        id: `${route}${componentName}`,
        keySegment: componentName,
        label: title ?? humanise(componentName),
        nodeData,
      };
    },
  );
};

const isExample = ({ nodeData }: TreeSourceNode<NodeData>) =>
  typeof nodeData?.componentName === "string";

const EXAMPLES_IMPORT =
  /import\s*\{([^}]*)\}\s*from\s*["'](\.{1,2}\/[^"']*\.examples)(?:\.tsx)?["']/g;

/**
 * The examples rendered by an mdx document, identified as `<path>#<name>`.
 * An example is embedded if it is imported from an examples module and
 * used as a JSX element.
 */
export const findEmbeddedExamples = (mdxPath: string, text: string) => {
  const embedded: string[] = [];
  for (const [, names, importPath] of text.matchAll(EXAMPLES_IMPORT)) {
    const examplePath = path.posix.join(
      path.posix.dirname(mdxPath),
      `${importPath}.tsx`,
    );
    for (const name of names.split(",").map((n) => n.trim())) {
      const localName = name.split(/\s+as\s+/).pop() ?? name;
      if (localName && text.includes(`<${localName}`)) {
        const exportName = name.split(/\s+as\s+/)[0];
        embedded.push(`${examplePath}#${exportName}`);
      }
    }
  }
  return embedded;
};

const visitNodes = (
  nodes: TreeSourceNode<NodeData>[],
  visit: (node: TreeSourceNode<NodeData>) => void,
) => {
  for (const node of nodes) {
    visit(node);
    if (node.childNodes) {
      visitNodes(node.childNodes, visit);
    }
  }
};

/**
 * Records, on each example, the documents that embed it. The document of
 * the example's own examples file is excluded, it is presented separately.
 */
const addDocReferences = (treeSourceNodes: TreeSourceNode<NodeData>[]) => {
  const examples = new Map<string, TreeSourceNode<NodeData>>();
  visitNodes(treeSourceNodes, (node) => {
    if (isExample(node) && node.nodeData?.path) {
      const key = `${path.posix.normalize(node.nodeData.path)}#${node.nodeData.componentName}`;
      examples.set(key, node);
    }
  });
  visitNodes(treeSourceNodes, (node) => {
    const mdxPath = node.nodeData?.path;
    if (mdxPath?.endsWith(".mdx")) {
      const text = fs.readFileSync(mdxPath).toString();
      for (const key of findEmbeddedExamples(
        path.posix.normalize(mdxPath),
        text,
      )) {
        const example = examples.get(key);
        const parentId = example?.id.slice(0, example.id.lastIndexOf("/"));
        if (example?.nodeData && parentId !== node.id) {
          const docs = (example.nodeData.docs ??= []);
          if (!docs.includes(node.id)) {
            docs.push(node.id);
          }
        }
      }
    }
  });
};

/**
 * Records, on every folder, the number of examples it contains and whether
 * any of them consume data.
 */
const addFolderSummaries = (
  treeSourceNodes: TreeSourceNode<NodeData>[],
): { count: number; live: boolean } => {
  let count = 0;
  let live = false;
  for (const node of treeSourceNodes) {
    if (node.childNodes?.length) {
      const summary = addFolderSummaries(node.childNodes);
      node.nodeData = { ...node.nodeData, count: summary.count };
      if (summary.live) {
        node.nodeData.live = true;
      }
      count += summary.count;
      live ||= summary.live;
    } else if (isExample(node)) {
      count += 1;
      live ||= node.nodeData?.live === true;
    }
  }
  return { count, live };
};
