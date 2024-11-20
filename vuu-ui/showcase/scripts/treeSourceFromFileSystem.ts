import fs from "fs";
import path from "path";
import { type TreeSourceNode } from "@finos/vuu-utils";

const lastPathSegment = (path: string, separator = "/") => {
  const root = path.endsWith(separator) ? path.slice(0, -1) : path;
  return root.slice(root.lastIndexOf(separator) + 1);
};

export const dropLastPathSegment = (path: string, separator = "/") => {
  return path.slice(0, path.lastIndexOf(separator));
};

const exportPattern = /export const ([A-Z][a-zA-Z]+) = /g;

export const treeSourceFromFileSystem = (
  exhibitsPath: string,
  route: string,
  icon = "folder",
): TreeSourceNode[] => {
  const treeSourceNodes: TreeSourceNode[] = [];
  fs.readdirSync(exhibitsPath).forEach((fileName) => {
    const filePath = path.join(exhibitsPath, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const treeSourceNode: TreeSourceNode = {
        id: `${route}${fileName}`,
        icon,
        label: fileName,
        childNodes: treeSourceFromFileSystem(
          filePath,
          `${route}${fileName}/`,
          "box",
        ),
      };
      if (
        Array.isArray(treeSourceNode.childNodes) &&
        treeSourceNode.childNodes.length > 0
      ) {
        treeSourceNodes.push(treeSourceNode);
      }
    } else if (fileName.match(/(examples.tsx|.mdx)$/)) {
      const name = dropLastPathSegment(dropLastPathSegment(fileName, "."), ".");
      const id = `${route}${name}`;
      if (name !== lastPathSegment(route)) {
        treeSourceNodes.push({
          id,
          icon: "box",
          label: name,
          childNodes: treeSourceFromExportedComponents(
            exhibitsPath,
            `${route}${name}/`,
            fileName,
          ),
        });
      } else {
        treeSourceNodes.push(
          ...treeSourceFromExportedComponents(exhibitsPath, route, fileName),
        );
      }
    }
  });
  return treeSourceNodes;
};

const treeSourceFromExportedComponents = (
  exhibitsPath: string,
  route,
  fileName: string,
) => {
  const filePath = path.join(exhibitsPath, fileName);
  const text = fs.readFileSync(filePath).toString();
  let match = exportPattern.exec(text);
  const treeSourceNodes: TreeSourceNode[] = [];
  while (match != null) {
    const componentName = match[1];
    treeSourceNodes.push({
      id: `${route}${componentName}`,
      label: componentName,
      nodeData: {
        componentName,
        path: `${exhibitsPath}/${fileName}`,
      },
    });
    match = exportPattern.exec(text);
  }
  return treeSourceNodes;
};
