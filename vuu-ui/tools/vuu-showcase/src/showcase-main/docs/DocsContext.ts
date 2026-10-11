import { createContext, useContext } from "react";

export interface DocsContextValue {
  /** route of the document being rendered, e.g /Docs/Table/Columns */
  docRoute: string;
  /** path of the mdx file, e.g src/examples/Docs/Table/02-Columns.mdx */
  documentPath?: string;
  /**
   * The href for a showcase route. In a standalone doc window, documents
   * open in the same window and examples open standalone.
   */
  hrefForRoute: (route: string, anchor?: string) => string;
  /** navigates to a showcase route, see hrefForRoute */
  navigateTo: (route: string, anchor?: string) => void;
}

export const DocsContext = createContext<DocsContextValue>({
  docRoute: "",
  hrefForRoute: (route) => route,
  navigateTo: () => undefined,
});

export const useDocsContext = () => useContext(DocsContext);
