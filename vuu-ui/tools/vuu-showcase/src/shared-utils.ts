import { importCSS, TreeSourceNode } from "@vuu-ui/vuu-utils";

type Environment = "development" | "production";
export const env = process.env.NODE_ENV as Environment;

export type VuuExample = {
  (props?: { [key: string]: unknown }): JSX.Element;
};

export const pathFromKey = (key: string) => key.slice(5).split("|").join("/");
export const keysFromPath = (path: string) => {
  if (path === "/") {
    return undefined;
  } else {
    return [`$root${path.split("/").join("|")}`];
  }
};

export type ComponentDescriptor = {
  componentName: string;
  path: string;
};

export type DocumentDescriptor = {
  name: string;
  path: string;
};

export const isComponentDescriptor = (
  val: unknown,
): val is ComponentDescriptor =>
  !!val &&
  typeof val === "object" &&
  typeof val["componentName"] === "string" &&
  typeof val["path"] === "string";

export const isDocumentDescriptor = (val: unknown): val is DocumentDescriptor =>
  !!val &&
  typeof val === "object" &&
  typeof val["name"] === "string" &&
  typeof val["path"] === "string";

export const getTargetTreeNode = <T = unknown>(
  url: URL,
  treeSourceNodes: TreeSourceNode<T>[],
  throwIfNotFound = true,
) => {
  const { pathname } = url;
  const keys = pathname.slice(1).split("/");

  let key = keys.shift();
  let treeNode = treeSourceNodes.find((node) => node.id === key);

  while (keys.length) {
    key += `/${keys.shift()}`;
    treeNode = treeNode?.childNodes?.find((node) => node.id === key);
  }

  if (
    isComponentDescriptor(treeNode?.nodeData) ||
    isDocumentDescriptor(treeNode?.nodeData)
  ) {
    return treeNode;
  } else if (throwIfNotFound) {
    throw Error("dsdsdsdsdsd");
  }
};

export const loadTheme = (themeName: string): Promise<void> =>
  new Promise((resolve) => {
    if (env === "development") {
      import(`./themes/${themeName}.ts`).then(() => {
        resolve();
      });
    } else {
      importCSS(`/themes/${themeName}.css`).then((styleSheet) => {
        document.adoptedStyleSheets = [
          ...document.adoptedStyleSheets,
          styleSheet,
        ];
        resolve();
      });
    }
  });
