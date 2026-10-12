import { type CssNode, generate, parse } from "css-tree";
import type { ThemeScope } from "./theme-model-types.ts";

/**
 * Classes of the form <prefix>-density-<value> express the density axis,
 * e.g .salt-density-high
 */
const DENSITY_CLASS = /^[a-z]+-density-([a-z0-9]+)$/i;

export interface AxisSource {
  axis: string;
  source: string;
  value: string;
}

const attributeValue = (node: CssNode): string | undefined => {
  if (node.type !== "AttributeSelector" || !node.value) return undefined;
  return node.value.type === "String" ? node.value.value : node.value.name;
};

/**
 * Parse a single (non-list) selector into a ThemeScope. Data attributes and
 * density classes become axis conditions, all other classes are retained as
 * 'base' classes. Anything else (combinators, pseudo classes, type
 * selectors) marks the scope as complex.
 */
export const parseScope = (
  selector: string,
  atRules: string[] = [],
  axisSources?: Map<string, string>,
): ThemeScope => {
  const ast = parse(selector, { context: "selector" });
  const conditions: Record<string, string> = {};
  const classes: string[] = [];
  let complex = false;

  if (ast.type === "Selector") {
    ast.children.forEach((node) => {
      switch (node.type) {
        case "ClassSelector": {
          const density = DENSITY_CLASS.exec(node.name);
          if (density) {
            conditions.density = density[1];
            axisSources?.set(
              "density",
              `.${node.name.replace(/-[^-]+$/, "")}-*`,
            );
          } else {
            classes.push(node.name);
          }
          break;
        }
        case "AttributeSelector": {
          const name = node.name.name;
          const value = attributeValue(node);
          if (name.startsWith("data-") && value !== undefined) {
            const axis = name.slice(5);
            conditions[axis] = value;
            axisSources?.set(axis, name);
          } else {
            complex = true;
          }
          break;
        }
        default:
          complex = true;
      }
    });
  } else {
    complex = true;
  }

  const id = complex
    ? generate(ast)
    : [
        ...[...classes].sort().map((c) => `.${c}`),
        ...Object.keys(conditions)
          .sort()
          .map((axis) => `[${axis}=${conditions[axis]}]`),
      ].join("") || ":root";

  const atRulePrefix = atRules.length ? `@${atRules.join(" @")} ` : "";

  return {
    id: `${atRulePrefix}${id}`,
    selector,
    conditions,
    classes,
    ...(atRules.length ? { atRules } : {}),
    ...(complex ? { complex } : {}),
  };
};
