import fs from "node:fs";
import path from "node:path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";

export type ComponentDescriptor = {
  componentName: string;
  kind: "component";
  moduleName: string;
  tags?: string[];
};

export type DocumentDescriptor = {
  kind: "document";
  moduleName: string;
};

export type ShowcaseNodeData = ComponentDescriptor | DocumentDescriptor;

export type ShowcaseExamples = {
  exposes: Record<string, string>;
  treeSource: TreeSourceNode<ShowcaseNodeData>[];
};

const componentFileSuffix = ".examples.tsx";
const documentFileSuffix = ".mdx";

export const moduleNameFromRelativePath = (relativePath: string) =>
  `examples/${relativePath
    .replace(componentFileSuffix, "")
    .replace(documentFileSuffix, "")}`;

export const exposeNameFromModuleName = (moduleName: string) =>
  `./${moduleName}`;

const descriptorFromFile = (
  relativePath: string,
  componentName?: string,
  tags?: string[],
): ShowcaseNodeData =>
  componentName === undefined
    ? {
        kind: "document",
        moduleName: moduleNameFromRelativePath(relativePath),
      }
    : {
        componentName,
        kind: "component",
        moduleName: moduleNameFromRelativePath(relativePath),
        tags,
      };

const exportedComponents = (
  filePath: string,
  relativePath: string,
  route: string,
  tags: Set<string>,
): TreeSourceNode<ShowcaseNodeData>[] => {
  const tokens =
    /export const ([A-Z][A-Za-z0-9_]*)\s*=|\/\*\*\s*tags=([-a-z,]*)\s*\*\//g;
  const childNodes: TreeSourceNode<ShowcaseNodeData>[] = [];
  let componentTags: string[] | undefined;

  for (const match of fs.readFileSync(filePath, "utf8").matchAll(tokens)) {
    if (match[2] !== undefined) {
      componentTags = match[2].split(",").filter(Boolean);
      componentTags.forEach((tag) => tags.add(tag));
    } else {
      const componentName = match[1];
      childNodes.push({
        id: `${route}${componentName}`,
        label: componentName,
        nodeData: descriptorFromFile(
          relativePath,
          componentName,
          componentTags,
        ) as ComponentDescriptor,
      });
      componentTags = undefined;
    }
  }

  return childNodes;
};

const discoverDirectory = (
  directory: string,
  relativeDirectory: string,
  route: string,
  tags: Set<string>,
  exposes: Record<string, string>,
): [TreeSourceNode<ShowcaseNodeData>[], DocumentDescriptor | undefined] => {
  const fileNames = fs.readdirSync(directory).sort();
  const directoryFiles = new Set(fileNames);
  const treeSource: TreeSourceNode<ShowcaseNodeData>[] = [];
  let directoryDocument: DocumentDescriptor | undefined;

  for (const fileName of fileNames) {
    const filePath = path.join(directory, fileName);
    const relativePath = path.join(relativeDirectory, fileName);

    if (fs.lstatSync(filePath).isDirectory()) {
      const [childNodes, document] = discoverDirectory(
        filePath,
        relativePath,
        `${route}${fileName}/`,
        tags,
        exposes,
      );
      const node: TreeSourceNode<ShowcaseNodeData> = {
        childNodes,
        icon: "folder",
        id: `${route}${fileName}`,
        label: fileName,
      };
      if (document) {
        node.nodeData = document;
      }
      if (childNodes.length > 0) {
        treeSource.push(node);
      }
    } else if (fileName.endsWith(componentFileSuffix)) {
      const name = fileName.slice(0, -componentFileSuffix.length);
      const moduleName = moduleNameFromRelativePath(relativePath);
      exposes[exposeNameFromModuleName(moduleName)] = filePath;

      const node: TreeSourceNode<ShowcaseNodeData> = {
        childNodes: exportedComponents(
          filePath,
          relativePath,
          `${route}${name}/`,
          tags,
        ),
        icon: "box",
        id: `${route}${name}`,
        label: name,
      };
      const documentFileName = `${name}${documentFileSuffix}`;
      if (directoryFiles.has(documentFileName)) {
        node.nodeData = descriptorFromFile(
          path.join(relativeDirectory, documentFileName),
        ) as DocumentDescriptor;
      }
      treeSource.push(node);
    } else if (fileName.toLowerCase() === "index.mdx") {
      const moduleName = moduleNameFromRelativePath(relativePath);
      exposes[exposeNameFromModuleName(moduleName)] = filePath;
      directoryDocument = descriptorFromFile(relativePath) as DocumentDescriptor;
    } else if (fileName.endsWith(documentFileSuffix)) {
      const name = fileName.slice(0, -documentFileSuffix.length);
      const moduleName = moduleNameFromRelativePath(relativePath);
      exposes[exposeNameFromModuleName(moduleName)] = filePath;
      treeSource.push({
        icon: "box",
        id: `${route}${name}`,
        label: name,
        nodeData: descriptorFromFile(relativePath) as DocumentDescriptor,
      });
    }
  }

  return [treeSource, directoryDocument];
};

export const discoverShowcaseExamples = (
  examplesDirectory: string,
): ShowcaseExamples => {
  const tags = new Set<string>();
  const exposes: Record<string, string> = {};
  const [treeSource] = discoverDirectory(
    examplesDirectory,
    "",
    "",
    tags,
    exposes,
  );

  return { exposes, treeSource };
};
