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

const importExportPattern =
  /(?:^(import) \{([^}]+)\} from "(.*)";)|(?:(export) const ([A-Z][a-zA-Z]+))/gm;
const importSeparator = /\s*,\s*/;
const componentPattern = /^[A-Z]/;

export const searchTargetsFromFileSystem = (
  exhibitsPath: string,
  route: string,
  icon = "folder",
): TreeSourceNode[] => {
  const treeSourceNodes: TreeSourceNode[] = [];
  fs.readdirSync(exhibitsPath).forEach((fileName) => {
    const filePath = path.join(exhibitsPath, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const childNodes = searchTargetsFromFileSystem(
        filePath,
        `${route}${fileName}/`,
        "box",
      );

      const treeSourceNode: TreeSourceNode = {
        childNodes,
        id: `${route}${fileName}`,
        icon,
        label: fileName,
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
          childNodes: showcaseComponentsAsTreeNodes(
            exhibitsPath,
            `${route}${name}/`,
            fileName,
          ),
        });
      } else {
        treeSourceNodes.push(
          ...showcaseComponentsAsTreeNodes(exhibitsPath, route, fileName),
        );
      }
    }
  });
  return treeSourceNodes;
};

const showcaseComponentsAsTreeNodes = (
  exhibitsPath: string,
  route,
  fileName: string,
) => {
  const imports: string[] = [];
  const filePath = path.join(exhibitsPath, fileName);
  const text = fs.readFileSync(filePath).toString();
  let match = importExportPattern.exec(text);
  const treeSourceNodes: TreeSourceNode[] = [];
  while (match != null) {
    if (match[1] === "import") {
      // Note the importa are file level, we need to tie them to
      // individual exhibits
      const importTarget = match[2];
      // const importSource = match[3];
      const importedComponents = importTarget
        .trim()
        .split(importSeparator)
        .filter((name) => componentPattern.test(name));
      imports.push(...importedComponents);
    } else if (match[4] === "export") {
      const componentName = match[5];
      treeSourceNodes.push({
        id: `${route}${componentName}`,
        label: componentName,
        nodeData: {
          componentName,
          imports,
          path: `${exhibitsPath}/${fileName}`,
        },
      });
    }

    match = importExportPattern.exec(text);
  }

  return treeSourceNodes;
};
