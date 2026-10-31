import type {
  AnatomyElement,
  AnatomyNode,
  AnatomyRef,
  ChainStep,
  ComponentAnatomyModel,
} from "./anatomy-types";

/** the class that names an element, the component class for the root */
export const primaryClass = (node: AnatomyNode, component: string) =>
  node.classes.find(
    (c) => c === `vuu${component}` || c === `salt${component}`,
  ) ??
  node.classes[0] ??
  "";

export const nodeLabel = (node: AnatomyNode, component: string) => {
  const name = primaryClass(node, component);
  return name ? `${node.tag}.${name}` : node.tag;
};

/** classes on every instance, other than the one that names the element */
export const secondaryClasses = (node: AnatomyNode, component: string) => {
  const name = primaryClass(node, component);
  return node.classes.filter(
    (c) => c && c !== name && !node.variantClasses.includes(c),
  );
};

/** the element and its ancestors, root first */
export const ancestry = (elements: AnatomyElement[], index: number) => {
  const chain: number[] = [];
  for (let i: number | null = index; i !== null; i = elements[i].parent) {
    chain.unshift(i);
  }
  return chain;
};

/**
 * A rect clipped to the component, virtualised content (e.g the rows of a
 * Table) extends beyond it.
 */
export const clipRect = (
  [x, y, w, h]: number[],
  [width, height]: [number, number],
) => {
  const left = Math.max(0, x);
  const top = Math.max(0, y);
  const right = Math.min(width, x + w);
  const bottom = Math.min(height, y + h);
  return [left, top, Math.max(0, right - left), Math.max(0, bottom - top)];
};

const contains = ([x, y, w, h]: number[], px: number, py: number) =>
  px >= x && px < x + w && py >= y && py < y + h;

/** the deepest visible element at a point, in component coordinates */
export const elementAt = (
  { elements, nodes, size }: ComponentAnatomyModel,
  x: number,
  y: number,
) => {
  let hit = -1;
  let hitDepth = -1;
  elements.forEach((element, index) => {
    const { depth } = nodes[element.node];
    const rect = clipRect(element.rect, size);
    if (
      !element.hidden &&
      rect[2] > 0 &&
      rect[3] > 0 &&
      depth >= hitDepth &&
      contains(rect, x, y)
    ) {
      hit = index;
      hitDepth = depth;
    }
  });
  return hit === -1 ? undefined : hit;
};

/**
 * The instance to select when a node is picked from the tree. Picking an
 * ancestor of the selected element selects that ancestor, rather than the
 * first instance (e.g picking Row while a Cell is selected keeps the row).
 */
export const instanceForNode = (
  model: ComponentAnatomyModel,
  nodeId: number,
  selected: number,
) => {
  const chain = ancestry(model.elements, selected);
  const { instances } = model.nodes[nodeId];
  return chain.find((i) => model.elements[i].node === nodeId) ?? instances[0];
};

const RGB_CHANNELS = /^rgba?\(var\(--[\w-]+-rgb\)/;

/**
 * Chain steps worth showing. Foundation colours are defined as
 * `rgb(var(--x-rgb))`, the `-rgb` channels add nothing for a reader.
 */
export const visibleSteps = (chain: ChainStep[]) => {
  const cut = chain.findIndex(
    (step) => step.kind === "literal" && RGB_CHANNELS.test(step.value),
  );
  return cut === -1 ? chain : chain.slice(0, cut);
};

/** a selector without the theme scope and :is() wrapping added by nesting */
export const displaySelector = (selector: string) => {
  let s = selector;
  for (let prev = ""; prev !== s;) {
    prev = s;
    s = s.replace(/:is\(([^()]*)\)/g, "$1");
  }
  return s.replace(/^\S*\.salt-theme\S*\s+/, "").trim();
};

export type RefGroupKind = "properties" | "defines" | "states" | "pseudo";

export interface RefGroup {
  kind: RefGroupKind;
  title: string;
  refs: AnatomyRef[];
}

const isCustomProperty = (property: string) => property.startsWith("--");

/**
 * Refs grouped for display: properties styled by theme variables, custom
 * properties defined here (for descendants), then conditional styles.
 */
export const groupRefs = (refs: AnatomyRef[]): RefGroup[] => {
  const groups = new Map<string, RefGroup>();
  const add = (
    key: string,
    kind: RefGroupKind,
    title: string,
    ref: AnatomyRef,
  ) => {
    const group = groups.get(key) ?? { kind, title, refs: [] };
    group.refs.push(ref);
    groups.set(key, group);
  };
  for (const ref of refs) {
    if (ref.pseudoElement) {
      add(`p${ref.pseudoElement}`, "pseudo", ref.pseudoElement, ref);
    } else if (ref.states?.length) {
      const title = ref.states.map((s) => `:${s}`).join(" ");
      add(`s${title}`, "states", title, ref);
    } else if (isCustomProperty(ref.property)) {
      add("defines", "defines", "Defines", ref);
    } else {
      add("properties", "properties", "Styles", ref);
    }
  }
  const order: RefGroupKind[] = ["properties", "defines", "states", "pseudo"];
  return [...groups.values()].sort(
    (a, b) =>
      order.indexOf(a.kind) - order.indexOf(b.kind) ||
      a.title.localeCompare(b.title),
  );
};

/** theme variables (not internal ones) referenced by a node */
export const themeVariableCount = (node: AnatomyNode) =>
  new Set(
    node.refs.flatMap((ref) =>
      ref.chain.flatMap((step) =>
        step.kind === "var" && step.tier !== "internal" ? [step.name] : [],
      ),
    ),
  ).size;

export const isColor = (value?: string) =>
  !!value &&
  typeof CSS !== "undefined" &&
  CSS.supports("color", value) &&
  !/^(inherit|initial|unset|currentcolor)$/i.test(value);
