import { importCSS, type TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { ReactElement } from "react";

export type ExhibitModule = Record<string, unknown>;

/**
 * Loads the module (examples or mdx document) for an exhibit, identified by
 * the path recorded in treeSource. By default, the module is loaded by url,
 * which works with the Vite dev server. The production (rsbuild) build passes
 * an importer backed by a generated map of bundled modules.
 */
export type ExhibitImporter = (path: string) => Promise<ExhibitModule>;

export const importExhibitByUrl: ExhibitImporter = (path) =>
  import(/* webpackIgnore: true */ /* @vite-ignore */ `/${path}`);

export type VuuExample = (props?: { [key: string]: unknown }) => ReactElement;

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
  typeof val["path"] === "string" &&
  val["path"].endsWith("mdx");

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
  // The theme module imports the theme css. This works in the Vite dev server
  // and in the bundled (rsbuild) production build, which emits the css as a
  // separate chunk, loaded with the theme module.
  import(`./themes/${themeName}.ts`).then(
    () => undefined,
    () =>
      importCSS(`/themes/${themeName}.css`).then((styleSheet) => {
        document.adoptedStyleSheets = [
          ...document.adoptedStyleSheets,
          styleSheet,
        ];
      }),
  );
