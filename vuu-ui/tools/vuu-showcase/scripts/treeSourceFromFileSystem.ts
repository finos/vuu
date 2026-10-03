import fs from "fs";
import path from "path";
import { type TreeSourceNode } from "@vuu-ui/vuu-utils";

export const dropLastPathSegment = (path: string, separator = "/") => {
  return path.slice(0, path.lastIndexOf(separator));
};

// A numeric prefix e.g "01-" can be used to control ordering. It is not
// displayed and is not part of the route (as with Docusaurus). Tree keys are
// derived from labels, so ids must use the same, unprefixed, names.
const toLabel = (name: string) => name.replace(/^\d+-/, "");

const getDocumentPath = (
  dirFiles: Set<string>,
  fileName: string,
): string | undefined => {
  const fileRoot = fileName.split(".").slice(0, -2).join();
  if (dirFiles.has(`${fileRoot}.mdx`)) {
    return `${fileRoot}.mdx`;
  }
};

const exportPattern =
  /(export const ([A-Z][a-zA-Z]+) = )|(\/\*\*\s*tags=([-a-z]*)\s*\*\/)/g;

export type NodeData = {
  componentName?: string;
  name?: string;
  path: string;
  tags?: string[];
};

export const treeSourceFromFileSystem = (
  exhibitsPath: string,
  env: "development" | "production" = "development",
  route = "",
  icon = "folder",
  tags = new Set<string>(),
): [TreeSourceNode<NodeData>[], string[], string | undefined] => {
  const treeSourceNodes: TreeSourceNode<NodeData>[] = [];
  let documentPath: string | undefined = undefined;
  const dirFiles = new Set<string>();

  // First store all directory file name in a set so we can check membership of related files
  // as we process
  fs.readdirSync(exhibitsPath).forEach((fileName) => {
    dirFiles.add(fileName);
  });

  dirFiles.forEach((fileName) => {
    const filePath = path.join(exhibitsPath, fileName);
    // console.log(`[treeSourceFromFileSystem] ${exhibitsPath}  ${filePath}`);
    if (fs.lstatSync(filePath).isDirectory()) {
      const [childNodes, , documentPath] = treeSourceFromFileSystem(
        filePath,
        env,
        `${route}${toLabel(fileName)}/`,
        "box",
        tags,
      );
      const treeSourceNode: TreeSourceNode<NodeData> = {
        id: `${route}${toLabel(fileName)}`,
        // a folder with an Index.mdx displays that document
        icon: documentPath ? "document" : icon,
        label: toLabel(fileName),
        childNodes,
      };
      if (documentPath) {
        treeSourceNode.nodeData = {
          name: fileName,
          path: documentPath,
        };
      }
      if (Array.isArray(childNodes) && childNodes.length > 0) {
        treeSourceNodes.push(treeSourceNode);
      }
    } else if (fileName.match(/examples.tsx$/)) {
      const name = dropLastPathSegment(dropLastPathSegment(fileName, "."), ".");
      const id = `${route}${toLabel(name)}`;

      const documentPath = getDocumentPath(dirFiles, fileName);
      const treeSourceNode: TreeSourceNode<NodeData> = {
        id,
        // examples with an accompanying mdx document display the document
        icon: documentPath ? "document" : "box",
        label: toLabel(name),
        childNodes: treeSourceFromExportedComponents(
          exhibitsPath,
          env,
          `${route}${toLabel(name)}/`,
          fileName,
          tags,
        ),
      };

      if (documentPath) {
        treeSourceNode.nodeData = treeSourceFromDocument(
          exhibitsPath,
          env,
          `${route}${toLabel(name)}/`,
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
        treeSourceNodes.push({
          id: `${route}${toLabel(name)}`,
          icon: "document",
          label: toLabel(name),
          nodeData: {
            name,
            ...treeSourceFromDocument(exhibitsPath, env, route, fileName),
          },
        });
      }
    }
  });
  return [treeSourceNodes, Array.from(tags), documentPath];
};

const treeSourceFromDocument = (
  exhibitsPath: string,
  env: "development" | "production",
  route: string,
  fileName: string,
): NodeData => {
  const resolvedFileName =
    env === "production" ? fileName.replace(/.mdx/, ".js") : fileName;

  return {
    path: `${exhibitsPath}/${resolvedFileName}`,
  };
};

const treeSourceFromExportedComponents = (
  exhibitsPath: string,
  env: "development" | "production",
  route: string,
  fileName: string,
  tagsList: Set<string>,
) => {
  const filePath = path.join(exhibitsPath, fileName);
  const text = fs.readFileSync(filePath).toString();
  let match = exportPattern.exec(text);
  const treeSourceNodes: TreeSourceNode<NodeData>[] = [];
  const exhibitsPrefix = env === "production" ? "showcase/" : "";
  const resolvedFileName =
    env === "production" ? fileName.replace(/.tsx/, ".js") : fileName;
  let tags: string[] | undefined = undefined;
  while (match != null) {
    // console.log({ m1: match[1], m2: match[2], m3: match[3], m4: match[4] });
    if (match[4] !== undefined) {
      tags = match[4].split(",");
      tags.forEach((tag) => tagsList.add(tag));
    } else {
      const componentName = match[2];
      treeSourceNodes.push({
        id: `${route}${componentName}`,
        label: componentName,
        nodeData: {
          componentName,
          path: `${exhibitsPrefix}${exhibitsPath}/${resolvedFileName}`,
          tags,
        },
      });
      tags = undefined;
    }
    match = exportPattern.exec(text);
  }
  return treeSourceNodes;
};
