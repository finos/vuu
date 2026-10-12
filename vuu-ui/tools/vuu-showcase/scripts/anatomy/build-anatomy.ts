import {
  ANATOMY_SCHEMA_VERSION,
  type AnatomyElement,
  type AnatomyNode,
  type AnatomyRef,
  type AnatomyTier,
  type ChainStep,
  type ComponentAnatomyModel,
} from "../../src/showcase-main/docs/anatomy/anatomy-types";

/** Captured in the page by collect-dom.js */
export interface RawMatch {
  rule: number;
  selector: string;
  states: string[];
  pseudoElement?: string;
}

export interface RawElement {
  /** an ancestor of the component root */
  context?: boolean;
  parent: number;
  tag: string;
  classes: string[];
  role?: string;
  rect?: [number, number, number, number];
  hidden?: boolean;
  preferred?: boolean;
  /** name of a nested component, see AnatomyTarget */
  nested?: string;
  text?: string;
  matches: RawMatch[];
  inline?: [string, string][];
  /** computed values of the properties declared, keyed by property */
  computed?: Record<string, string>;
}

export interface RawRule {
  /** document order */
  order: number;
  decls: [string, string][];
}

export interface RawCapture {
  rootIndex: number;
  size: [number, number];
  elements: RawElement[];
  rules: RawRule[];
}

export type Specificity = [number, number, number];

/** args of a functional pseudo class, from the open paren at index */
const functionalArgs = (selector: string, open: number) => {
  let depth = 0;
  for (let i = open; i < selector.length; i++) {
    if (selector[i] === "(") depth += 1;
    else if (selector[i] === ")" && --depth === 0) {
      return { args: selector.slice(open + 1, i), end: i + 1 };
    }
  }
  return { args: selector.slice(open + 1), end: selector.length };
};

const splitTopLevel = (text: string, separator = ",") => {
  const parts: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(" || c === "[") depth += 1;
    else if (c === ")" || c === "]") depth -= 1;
    else if (c === separator && depth === 0) {
      parts.push(text.slice(from, i));
      from = i + 1;
    }
  }
  parts.push(text.slice(from));
  return parts.map((part) => part.trim()).filter(Boolean);
};

const addSpecificity = (a: Specificity, b: Specificity): Specificity => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

export const compareSpecificity = (a: Specificity, b: Specificity) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const maxSpecificity = (selectors: string[]) =>
  selectors
    .map(specificity)
    .reduce<Specificity>(
      (max, s) => (compareSpecificity(s, max) > 0 ? s : max),
      [0, 0, 0],
    );

/** Specificity of a single (complex) selector, per Selectors Level 4 */
export function specificity(selector: string): Specificity {
  let result: Specificity = [0, 0, 0];
  let i = 0;
  const ident = /^-?[_a-zA-Z\u00a0-\uffff][\w-]*|^\\./;
  while (i < selector.length) {
    const c = selector[i];
    const rest = selector.slice(i);
    if (c === "#") {
      result = addSpecificity(result, [1, 0, 0]);
      i += 1 + (rest.slice(1).match(/^[\w-]+/)?.[0].length ?? 0);
    } else if (c === ".") {
      result = addSpecificity(result, [0, 1, 0]);
      i += 1 + (rest.slice(1).match(/^[\w-]+/)?.[0].length ?? 0);
    } else if (c === "[") {
      result = addSpecificity(result, [0, 1, 0]);
      const close = selector.indexOf("]", i);
      i = close === -1 ? selector.length : close + 1;
    } else if (rest.startsWith("::")) {
      result = addSpecificity(result, [0, 0, 1]);
      const name = rest.slice(2).match(/^[\w-]+/)?.[0] ?? "";
      i += 2 + name.length;
      if (selector[i] === "(") i = functionalArgs(selector, i).end;
    } else if (c === ":") {
      const name = rest.slice(1).match(/^[\w-]+/)?.[0] ?? "";
      i += 1 + name.length;
      if (selector[i] === "(") {
        const { args, end } = functionalArgs(selector, i);
        i = end;
        if (name === "where") {
          // no specificity
        } else if (name === "is" || name === "not" || name === "has") {
          result = addSpecificity(result, maxSpecificity(splitTopLevel(args)));
        } else if (/^nth-(last-)?child$/.test(name) && / of /.test(args)) {
          const of = args.slice(args.indexOf(" of ") + 4);
          result = addSpecificity(
            addSpecificity(result, [0, 1, 0]),
            maxSpecificity(splitTopLevel(of)),
          );
        } else {
          result = addSpecificity(result, [0, 1, 0]);
        }
      } else if (
        ["before", "after", "first-line", "first-letter"].includes(name)
      ) {
        // legacy single colon pseudo elements
        result = addSpecificity(result, [0, 0, 1]);
      } else {
        result = addSpecificity(result, [0, 1, 0]);
      }
    } else if (c === "*") {
      i += 1;
    } else if (ident.test(rest)) {
      result = addSpecificity(result, [0, 0, 1]);
      i += rest.match(ident)?.[0].length ?? 1;
    } else {
      // combinator or whitespace
      i += 1;
    }
  }
  return result;
}

/** var(--name) or var(--name, fallback), the whole of value; else undefined */
export const parseVarReference = (value: string) => {
  const text = value.trim();
  if (!text.startsWith("var(") || !text.endsWith(")")) return undefined;
  const { args, end } = functionalArgs(text, 3);
  if (end !== text.length) return undefined;
  const comma = splitTopLevel(args).length > 1 ? topLevelComma(args) : -1;
  const name = (comma === -1 ? args : args.slice(0, comma)).trim();
  if (!name.startsWith("--")) return undefined;
  const fallback = comma === -1 ? undefined : args.slice(comma + 1).trim();
  return { name, fallback };
};

const topLevelComma = (text: string) => {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") depth -= 1;
    else if (text[i] === "," && depth === 0) return i;
  }
  return -1;
};

/** names of the variables referenced in a value */
export const varReferences = (value: string) =>
  [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(([, name]) => name);

/** e.g --vuuTable-background, --VuuTableRow-fontSize, --saltButton-padding */
const isComponentHook = (name: string) => /^--(vuu|Vuu|salt)[A-Z]/.test(name);

export type ThemeTierLookup = (name: string) => AnatomyTier | undefined;

export const tierOf = (name: string, themeTier: ThemeTierLookup) =>
  isComponentHook(name)
    ? "hook"
    : (themeTier(name) ?? (name.startsWith("--salt-") ? "other" : "internal"));

const MAX_CHAIN = 24;

interface Declaration {
  value: string;
  selector: string;
  element: number;
  source: "component" | "theme" | "inline";
}

/** a variable to be read at an element, after the chains are built */
export interface ValueLookup {
  /** index of the element in the capture */
  element: number;
  name: string;
  apply: (value: string) => void;
}

export interface BuildAnatomyOptions {
  component: string;
  example: string;
  theme: string;
  mode: string;
  density: string;
  themeTier: ThemeTierLookup;
  /** declarations kept for nested components, by component name */
  keepNested?: Record<string, RegExp>;
}

/**
 * Builds the anatomy model from a capture. Elements are grouped into nodes
 * by their path of signatures (tag and first class) from the root, so that
 * repeated elements (rows, cells) become one node. Variable chains are
 * resolved by following declarations up the tree, as the cascade would.
 *
 * Returns the model and the variables whose values are to be read from the
 * page (see applyValues).
 */
export function buildAnatomy(raw: RawCapture, options: BuildAnatomyOptions) {
  const { elements, rules, rootIndex } = raw;
  const specificities = new Map<string, Specificity>();
  const specificityOf = (selector: string) => {
    let s = specificities.get(selector);
    if (!s) {
      s = specificity(selector);
      specificities.set(selector, s);
    }
    return s;
  };

  /** the winning declaration of a variable at an element, or inherited */
  const declarationCache = new Map<string, Declaration | null>();
  const lookup = (name: string, index: number): Declaration | undefined => {
    const key = `${index}|${name}`;
    const cached = declarationCache.get(key);
    if (cached !== undefined) return cached ?? undefined;
    const element = elements[index];
    let best: (Declaration & { s: Specificity; order: number }) | undefined;
    for (const match of element.matches) {
      if (match.states.length || match.pseudoElement) continue;
      const rule = rules[match.rule];
      const decl = rule.decls.findLast(([property]) => property === name);
      if (!decl) continue;
      const s = specificityOf(match.selector);
      const better =
        !best ||
        compareSpecificity(s, best.s) > 0 ||
        (compareSpecificity(s, best.s) === 0 && rule.order >= best.order);
      if (better) {
        best = {
          value: decl[1],
          selector: match.selector,
          element: index,
          source: element.context ? "theme" : "component",
          s,
          order: rule.order,
        };
      }
    }
    const inline = element.inline?.findLast(([property]) => property === name);
    let result: Declaration | undefined = inline
      ? {
          value: inline[1],
          selector: "style",
          element: index,
          source: "inline",
        }
      : best && {
          value: best.value,
          selector: best.selector,
          element: best.element,
          source: best.source,
        };
    if (!result && element.parent >= 0) {
      result = lookup(name, element.parent);
    }
    declarationCache.set(key, result ?? null);
    return result;
  };

  const lookups: ValueLookup[] = [];

  const buildChain = (
    value: string,
    element: number,
    depth = 0,
  ): ChainStep[] => {
    if (depth > MAX_CHAIN) return [];
    const reference = parseVarReference(value);
    if (!reference) {
      const names = varReferences(value);
      const literal: ChainStep = { kind: "literal", value: value.trim() };
      return names.length === 1
        ? [literal, ...buildChain(`var(${names[0]})`, element, depth + 1)]
        : [literal];
    }
    const { name, fallback } = reference;
    const decl = lookup(name, element);
    const step: Extract<ChainStep, { kind: "var" }> = {
      kind: "var",
      name,
      tier: tierOf(name, options.themeTier),
      set: decl !== undefined,
    };
    if (decl) {
      step.selector = decl.selector;
      step.source = decl.source;
    }
    lookups.push({
      element,
      name,
      apply: (value) => {
        step.value = value;
      },
    });
    if (decl) {
      // a custom property is computed where it is declared
      return [step, ...buildChain(decl.value, decl.element, depth + 1)];
    }
    return fallback === undefined
      ? [step]
      : [step, ...buildChain(fallback, element, depth + 1)];
  };

  // ---- group elements into nodes ----
  interface Draft {
    node: AnatomyNode;
    key: string;
    children: Draft[];
    perParent: Map<number, number>;
    roles: Set<string | undefined>;
    texts: Set<string | undefined>;
  }
  const signature = (element: RawElement) =>
    element.classes[0] ? `${element.tag}.${element.classes[0]}` : element.tag;

  const drafts = new Map<string, Draft>();
  const draftOf = new Map<number, Draft>();
  let rootDraft: Draft | undefined;
  /** preferred, or a descendant of a preferred element */
  const favoured = new Set<number>();

  for (let index = rootIndex; index < elements.length; index++) {
    const element = elements[index];
    const parentDraft =
      index === rootIndex ? undefined : draftOf.get(element.parent);
    const key = `${parentDraft?.key ?? ""}>${signature(element)}`;
    let draft = drafts.get(key);
    if (!draft) {
      draft = {
        key,
        children: [],
        perParent: new Map(),
        roles: new Set(),
        texts: new Set(),
        node: {
          id: -1,
          parent: null,
          depth: parentDraft ? parentDraft.node.depth + 1 : 0,
          tag: element.tag,
          classes: [...element.classes],
          variantClasses: [],
          count: 0,
          total: 0,
          instances: [],
          refs: [],
        },
      };
      drafts.set(key, draft);
      if (parentDraft) parentDraft.children.push(draft);
      else rootDraft = draft;
    }
    draftOf.set(index, draft);
    draft.node.instances.push(index);
    draft.perParent.set(
      element.parent,
      (draft.perParent.get(element.parent) ?? 0) + 1,
    );
    draft.roles.add(element.role);
    draft.texts.add(element.text);
    if (element.preferred || favoured.has(element.parent)) favoured.add(index);
  }
  if (!rootDraft) {
    throw Error("no root element");
  }

  // document order, a parent before its children
  const ordered: Draft[] = [];
  const walk = (draft: Draft) => {
    draft.node.id = ordered.length;
    ordered.push(draft);
    draft.children.forEach(walk);
  };
  walk(rootDraft);

  const elementIndex = (index: number) => index - rootIndex;

  for (const draft of ordered) {
    const { node } = draft;
    const instances = node.instances.map((index) => elements[index]);
    const all = new Set(instances.flatMap((element) => element.classes));
    node.classes = [...all].filter((name) =>
      instances.every((element) => element.classes.includes(name)),
    );
    node.variantClasses = [...all].filter(
      (name) => !node.classes.includes(name),
    );
    node.count = Math.max(...draft.perParent.values());
    node.total = instances.length;
    if (draft.roles.size === 1 && instances[0].role) {
      node.role = instances[0].role;
    }
    if (draft.texts.size === 1 && instances[0].text) {
      node.text = instances[0].text;
    }
    const nested = instances[0].nested;
    if (nested) node.component = nested;
    const keep = nested ? options.keepNested?.[nested] : undefined;

    // ---- declarations ----
    const refs = new Map<
      string,
      { ref: AnatomyRef; matched: number; won: boolean }
    >();
    for (const index of node.instances) {
      const element = elements[index];
      const declared: {
        key: string;
        property: string;
        value: string;
        selector: string;
        states: string[];
        pseudoElement?: string;
        s: Specificity;
        order: number;
      }[] = [];
      for (const match of element.matches) {
        if (nested && !keep?.test(match.selector)) continue;
        const rule = rules[match.rule];
        for (const [property, value] of rule.decls) {
          declared.push({
            key: [
              property,
              match.selector,
              match.states.join(),
              match.pseudoElement ?? "",
            ].join("|"),
            property,
            value,
            selector: match.selector,
            states: match.states,
            pseudoElement: match.pseudoElement,
            s: specificityOf(match.selector),
            order: rule.order,
          });
        }
      }
      for (const [property, value] of element.inline ?? []) {
        declared.push({
          key: `${property}|style||`,
          property,
          value,
          selector: "style",
          states: [],
          s: [Number.POSITIVE_INFINITY, 0, 0],
          order: Number.MAX_SAFE_INTEGER,
        });
      }
      // the declaration that wins, for each property, in the default state
      const winners = new Map<string, (typeof declared)[number]>();
      for (const d of declared) {
        if (d.states.length) continue;
        const property = `${d.pseudoElement ?? ""}|${d.property}`;
        const best = winners.get(property);
        const better =
          !best ||
          d.s[0] > best.s[0] ||
          (d.s[0] === best.s[0] &&
            (compareSpecificity(d.s, best.s) > 0 ||
              (compareSpecificity(d.s, best.s) === 0 &&
                d.order >= best.order)));
        if (better) winners.set(property, d);
      }
      const seen = new Set<string>();
      for (const d of declared) {
        if (seen.has(d.key)) continue;
        seen.add(d.key);
        const won =
          d.states.length > 0 ||
          winners.get(`${d.pseudoElement ?? ""}|${d.property}`) === d;
        const existing = refs.get(d.key);
        if (existing) {
          existing.matched += 1;
          existing.won ||= won;
          continue;
        }
        const isCustom = d.property.startsWith("--");
        const ref: AnatomyRef = {
          property: d.property,
          selector: d.selector,
          declared: d.value,
          chain: buildChain(d.value, index),
        };
        if (d.states.length) ref.states = d.states;
        if (d.pseudoElement) ref.pseudoElement = d.pseudoElement;
        if (isCustom) {
          if (d.states.length === 0 && !d.pseudoElement) {
            lookups.push({
              element: index,
              name: d.property,
              apply: (value) => {
                ref.value = value;
              },
            });
          }
        } else if (d.states.length === 0) {
          const key = d.pseudoElement
            ? `${d.pseudoElement} ${d.property}`
            : d.property;
          ref.value = element.computed?.[key];
        }
        refs.set(d.key, { ref, matched: 1, won });
      }
    }
    node.refs = [...refs.values()].map(({ ref, matched, won }) => {
      if (matched < node.total) ref.instances = matched;
      if (!won) ref.overridden = true;
      return ref;
    });

    // favoured instances first, the first instance is the one shown
    node.instances.sort(
      (a, b) => Number(favoured.has(b)) - Number(favoured.has(a)),
    );
  }

  const nodes = ordered.map(({ node }) => ({
    ...node,
    parent: null as number | null,
    instances: node.instances.map(elementIndex),
  }));
  ordered.forEach((draft, i) => {
    const parentIndex = elements[draft.node.instances[0]].parent;
    const parentDraft = draftOf.get(parentIndex);
    nodes[i].parent = parentDraft ? parentDraft.node.id : null;
  });

  const anatomyElements: AnatomyElement[] = elements
    .slice(rootIndex)
    .map((element, i) => {
      const result: AnatomyElement = {
        node: draftOf.get(i + rootIndex)?.node.id ?? -1,
        parent: i === 0 ? null : elementIndex(element.parent),
        rect: element.rect ?? [0, 0, 0, 0],
      };
      if (element.hidden) result.hidden = true;
      return result;
    });

  const model: ComponentAnatomyModel = {
    schemaVersion: ANATOMY_SCHEMA_VERSION,
    component: options.component,
    example: options.example,
    theme: options.theme,
    mode: options.mode,
    density: options.density,
    size: raw.size,
    nodes,
    elements: anatomyElements,
  };
  return { model, lookups };
}

/** Applies the values read from the page, in the order of lookups */
export function applyValues(lookups: ValueLookup[], values: string[]) {
  lookups.forEach(({ apply }, i) => {
    if (values[i]) apply(values[i]);
  });
}

/**
 * JSON, readable and diffable but compact: one line per element and per
 * declaration (chains repeat a lot, indenting them triples the size).
 */
export const formatAnatomy = ({
  nodes,
  elements,
  ...header
}: ComponentAnatomyModel) => {
  const json = (value: unknown) => JSON.stringify(value);
  const formatNode = ({ refs, instances, ...node }: AnatomyNode) =>
    [
      `    ${json(node).slice(0, -1)},`,
      `      "instances": ${json(instances)},`,
      `      "refs": [${refs.length ? "\n" : ""}${refs
        .map((ref) => `        ${json(ref)}`)
        .join(",\n")}${refs.length ? "\n      " : ""}]`,
      "    }",
    ].join("\n");
  return [
    `${json(header).slice(0, -1)},`,
    `  "nodes": [\n${nodes.map(formatNode).join(",\n")}\n  ],`,
    `  "elements": [\n${elements.map((element) => `    ${json(element)}`).join(",\n")}\n  ]`,
    "}\n",
  ].join("\n");
};
