import fs from "fs";
import path from "path";
import { type TreeSourceNode } from "@finos/vuu-utils";

export const dropLastPathSegment = (path: string, separator = "/") => {
  return path.slice(0, path.lastIndexOf(separator));
};

const exportPattern = /export const ([A-Z][a-zA-Z]+) = /g;

export const treeSourceFromFileSystem = (
  exhibitsPath: string,
  env: "development" | "production" = "development",
  route = "",
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
          env,
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
        ),
      });
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
  return treeSourceNodes;
};

const treeSourceFromExportedComponents = (
  exhibitsPath: string,
  env: "development" | "production",
  route,
  fileName: string,
) => {
  const filePath = path.join(exhibitsPath, fileName);
  const text = fs.readFileSync(filePath).toString();
  let match = exportPattern.exec(text);
  const treeSourceNodes: TreeSourceNode[] = [];
  const exhibitsPrefix = env === "production" ? "showcase/" : "";
  const resolvedFileName =
    env === "production" ? fileName.replace(/.tsx/, ".js") : fileName;
  while (match != null) {
    const componentName = match[1];
    treeSourceNodes.push({
      id: `${route}${componentName}`,
      label: componentName,
      nodeData: {
        componentName,
        path: `${exhibitsPrefix}${exhibitsPath}/${resolvedFileName}`,
      },
    });
    match = exportPattern.exec(text);
  }
  return treeSourceNodes;
};
