/**
 * The component anatomies captured by extract-anatomy.ts. Each is captured
 * from a Showcase example, which should render the same on every run (static
 * data, fixed size). Paths are relative to vuu-ui.
 */
export interface AnatomyTarget {
  component: string;
  /** Showcase route of the example */
  example: string;
  /** selector of the component root, within the example */
  rootSelector: string;
  /**
   * Selectors of elements to show first, when an element is repeated. e.g the
   * selected row, so that its cells are the ones outlined by default.
   */
  prefer?: string[];
  /**
   * Other components rendered within this one, e.g a Button. Their children
   * are not captured, only the declarations whose selector matches keep
   * (those made by this component) are.
   */
  nested?: { selector: string; name: string; keep: RegExp }[];
  /** output folder, the capture is written as <name>.anatomy.json and .png */
  outDir: string;
  name: string;
}

export const anatomyTargets: AnatomyTarget[] = [
  {
    component: "Table",
    example: "/Docs/Table/Anatomy/TableAnatomy",
    rootSelector: ".vuuTable",
    prefer: [".vuuTableRow[aria-selected='true']"],
    nested: [{ selector: ".saltButton", name: "Button", keep: /\.vuu/ }],
    outDir: "showcase/src/examples/Docs/Table/anatomy",
    name: "table",
  },
];
