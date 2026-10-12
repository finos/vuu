/**
 * A static snapshot of a component's anatomy: its rendered DOM structure and
 * the CSS variables used by each element. Captured from a running example by
 * scripts/anatomy/extract-anatomy.ts, rendered by ComponentAnatomy.
 *
 * This file must remain free of imports, it is shared by the capture script
 * and the Showcase.
 */

export const ANATOMY_SCHEMA_VERSION = 1;

/**
 * api             - an API variable, public to the component, e.g --vuuTable-background
 * internal        - a private component variable, e.g --table-background
 * characteristics - theme tiers, from the theme model
 * palette
 * foundations
 * other           - a theme variable that is not part of a tier
 */
export type AnatomyTier =
  "api" | "internal" | "characteristics" | "palette" | "foundations" | "other";

export type ChainStep =
  | {
      kind: "var";
      name: string;
      tier: AnatomyTier;
      /** false if the variable is not declared, its fallback is used */
      set: boolean;
      /** selector of the rule that sets the variable */
      selector?: string;
      /** where the variable is set: by the component, the theme or inline */
      source?: "component" | "theme" | "inline";
      /** value at the element, as computed by the browser */
      value?: string;
    }
  /** a value that is not a single variable reference, e.g 0 11px 0 8px */
  | { kind: "literal"; value: string };

export interface AnatomyRef {
  /** the property declared, a css property or a custom property */
  property: string;
  /** the selector (of a comma separated list) that matched the element */
  selector: string;
  /** state pseudo classes the rule depends on, e.g ["hover"] */
  states?: string[];
  /** pseudo element the rule applies to, e.g ::before */
  pseudoElement?: string;
  /** set when the rule matches only some instances of a repeated element */
  instances?: number;
  /** true if the declaration loses, on every instance, to another rule */
  overridden?: boolean;
  /** the declared value, as written */
  declared: string;
  /** variables, from the one referenced through to the final value */
  chain: ChainStep[];
  /** the computed value of the property */
  value?: string;
}

export interface AnatomyNode {
  id: number;
  parent: number | null;
  depth: number;
  tag: string;
  /** classes present on every instance */
  classes: string[];
  /** classes present on some instances, e.g vuuTableRow-selected */
  variantClasses: string[];
  role?: string;
  /** a component nested within this one, its internals are not shown */
  component?: string;
  /** text, for elements with no element children */
  text?: string;
  /** most instances within one parent */
  count: number;
  /** total instances */
  total: number;
  /** element indices of the instances */
  instances: number[];
  /** declarations that use variables, or set custom properties */
  refs: AnatomyRef[];
}

export interface AnatomyElement {
  node: number;
  parent: number | null;
  /** x, y, width, height relative to the component root */
  rect: [number, number, number, number];
  hidden?: boolean;
}

export interface ComponentAnatomyModel {
  schemaVersion: typeof ANATOMY_SCHEMA_VERSION;
  component: string;
  /** showcase route of the example captured */
  example: string;
  theme: string;
  mode: string;
  density: string;
  /** width and height of the component root */
  size: [number, number];
  /** in document order, a parent precedes its children */
  nodes: AnatomyNode[];
  elements: AnatomyElement[];
}
