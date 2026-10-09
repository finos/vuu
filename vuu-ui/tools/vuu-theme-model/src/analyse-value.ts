import { type CssNode, parse, walk } from "css-tree";
import type { ValueKind } from "./theme-model-types.ts";

const COLOR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
  "light-dark",
]);

const COLOR_KEYWORDS = new Set([
  "transparent",
  "currentcolor",
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "gray",
  "grey",
]);

export interface ValueAnalysis {
  kind: ValueKind;
  references: string[];
}

const significantChildren = (node: CssNode): CssNode[] => {
  if (node.type !== "Value") return [node];
  return node.children.toArray().filter((n) => n.type !== "WhiteSpace");
};

const kindOfSingleNode = (node: CssNode): ValueKind => {
  switch (node.type) {
    case "Hash":
      return "color";
    case "Function": {
      const name = node.name.toLowerCase();
      if (name === "var") return "reference";
      if (name === "calc") return "calc";
      if (COLOR_FUNCTIONS.has(name)) return "color";
      return "composite";
    }
    case "Dimension":
      return "dimension";
    case "Number":
      return "number";
    case "Percentage":
      return "percentage";
    case "String":
      return "string";
    case "Identifier":
      return COLOR_KEYWORDS.has(node.name.toLowerCase()) ? "color" : "keyword";
    default:
      return "composite";
  }
};

const isColorChannels = (nodes: CssNode[]) =>
  nodes.length === 5 &&
  nodes.every((n, i) =>
    i % 2 === 0
      ? n.type === "Number" || n.type === "Percentage"
      : n.type === "Operator" && n.value === ",",
  );

/**
 * Determine the structural kind of a custom property value and collect any
 * custom properties it references.
 */
export const analyseValue = (raw: string): ValueAnalysis => {
  const text = raw.trim();
  if (text === "") {
    return { kind: "keyword", references: [] };
  }

  let ast: CssNode;
  try {
    ast = parse(text, { context: "value" });
  } catch {
    return { kind: "composite", references: collectReferences(text) };
  }

  const references: string[] = [];
  walk(ast, {
    visit: "Function",
    enter(node) {
      if (node.name.toLowerCase() === "var") {
        const first = node.children.first;
        if (first?.type === "Identifier" && first.name.startsWith("--")) {
          if (!references.includes(first.name)) references.push(first.name);
        }
      }
    },
  });

  const nodes = significantChildren(ast);
  let kind: ValueKind;
  if (nodes.length === 1) {
    kind = kindOfSingleNode(nodes[0]);
  } else if (isColorChannels(nodes)) {
    kind = "color-channels";
  } else {
    kind = "composite";
  }

  return { kind, references };
};

const collectReferences = (text: string) => [
  ...new Set([...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1])),
];
