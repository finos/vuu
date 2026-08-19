import { importCSS, TreeSourceNode } from "@vuu-ui/vuu-utils";
import { ReactElement } from "react";

type Environment = "development" | "production";
export const env = process.env.NODE_ENV as Environment;

export type VuuExample = {
  (props?: { [key: string]: unknown }): ReactElement;
};

export const pathFromKey = (key: string) => key.slice(5).split("|").join("/");
export const keyFromPath = (path: string) => {
  if (path === "/") {
    return undefined;
  } else {
    return `$root${path.split("/").join("|")}`;
  }
};

export type ComponentDescriptor = {
  componentName: string;
  kind: "component";
  moduleName: string;
};

export type DocumentDescriptor = {
  kind: "document";
  moduleName: string;
};

export const isComponentDescriptor = (
  val: unknown,
): val is ComponentDescriptor => {
  if (!val || typeof val !== "object") {
    return false;
  }
  const descriptor = val as Record<string, unknown>;
  return (
    typeof descriptor.componentName === "string" &&
    descriptor.kind === "component" &&
    typeof descriptor.moduleName === "string"
  );
};

export const isDocumentDescriptor = (
  val: unknown,
): val is DocumentDescriptor => {
  if (!val || typeof val !== "object") {
    return false;
  }
  const descriptor = val as Record<string, unknown>;
  return (
    descriptor.kind === "document" && typeof descriptor.moduleName === "string"
  );
};

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
    throw Error(`Target tree node not found for path: ${pathname}`);
  }
};

export const loadTheme = (themeName: string): Promise<void> =>
  loadBundledTheme(themeName)
    .then(() => undefined)
    .catch(() =>
      importCSS(`/themes/${themeName}.css`).then((styleSheet) => {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        styleSheet,
      ];
      }),
    );

const loadBundledTheme = (themeName: string): Promise<unknown> => {
  switch (themeName) {
    case "salt-theme-next":
      return import("./themes/salt-theme-next");
    case "vuu-theme":
      return import("./themes/vuu-theme");
    default:
      return Promise.reject(new Error(`Unknown showcase theme: ${themeName}`));
  }
};
