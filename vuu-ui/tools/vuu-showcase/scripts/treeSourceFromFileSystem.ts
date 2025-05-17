import fs from "fs";
import path from "path";
import { type TreeSourceNode } from "@finos/vuu-utils";

export const dropLastPathSegment = (path: string, separator = "/") => {
  return path.slice(0, path.lastIndexOf(separator));
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
  let indexPath: string | undefined = undefined;
  fs.readdirSync(exhibitsPath).forEach((fileName) => {
    const filePath = path.join(exhibitsPath, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const [childNodes, , indexPath] = treeSourceFromFileSystem(
        filePath,
        env,
        `${route}${fileName}/`,
        "box",
        tags,
      );
      const treeSourceNode: TreeSourceNode<NodeData> = {
        id: `${route}${fileName}`,
        icon,
        label: fileName,
        childNodes,
      };
      if (indexPath) {
        treeSourceNode.nodeData = {
          name: fileName,
          path: indexPath,
        };
      }
      if (Array.isArray(childNodes) && childNodes.length > 0) {
        treeSourceNodes.push(treeSourceNode);
      }
    } else if (fileName.match(/examples.tsx$/)) {
      const name = dropLastPathSegment(dropLastPathSegment(fileName, "."), ".");
      const id = `${route}${name}`;
      treeSourceNodes.push({
        id,
        icon: "box",
        label: name,
        childNodes: treeSourceFromExportedComponents(
          exhibitsPath,
          env,
          `${route}${name}/`,
          fileName,
          tags,
        ),
      });
    } else if (fileName.match(/^index.mdx$/)) {
      indexPath = `${exhibitsPath}/${fileName}`;
    } else if (fileName.match(/.mdx$/)) {
      const name = dropLastPathSegment(fileName, ".");
      const id = `${route}${name}`;
      treeSourceNodes.push({
        id,
        icon: "box",
        label: name,
        nodeData: {
          name,
          path: `${exhibitsPath}/${fileName}`,
        },
      });
    }
  });
  return [treeSourceNodes, Array.from(tags), indexPath];
};

const treeSourceFromExportedComponents = (
  exhibitsPath: string,
  env: "development" | "production",
  route,
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
