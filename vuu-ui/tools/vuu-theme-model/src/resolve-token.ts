import type { ThemeModel, ThemeToken } from "./theme-model-types.ts";

export type Axes = Record<string, string>;

const MAX_DEPTH = 32;

/**
 * The declared value of a token that applies under the given axes: the value
 * from the most specific matching scope (selectors are classes and attributes,
 * so specificity is their count), the later declaration if equal.
 * Scopes with complex selectors or at-rules are ignored.
 */
export const applicableValue = (
  model: ThemeModel,
  token: ThemeToken,
  axes: Axes,
) => {
  const scopes = new Map(model.scopes.map((scope) => [scope.id, scope]));
  let best: { raw: string; specificity: number } | undefined;
  for (const value of token.values) {
    const scope = scopes.get(value.scopeId);
    if (!scope || scope.complex || scope.atRules?.length) continue;
    const conditions = Object.entries(scope.conditions);
    if (conditions.every(([axis, axisValue]) => axes[axis] === axisValue)) {
      const specificity = conditions.length + scope.classes.length;
      if (best === undefined || specificity >= best.specificity) {
        best = { raw: value.raw, specificity };
      }
    }
  }
  return best?.raw;
};

/** index of the parenthesis closing the one at openIndex */
const closingParen = (text: string, openIndex: number) => {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
};

/** index of the first top level comma, -1 if none */
const topLevelComma = (text: string) => {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") depth -= 1;
    else if (text[i] === "," && depth === 0) return i;
  }
  return -1;
};

/**
 * Static resolution of a token, substituting var() references, as css would
 * under the given axes. Returns undefined if the value cannot be resolved.
 * This approximates the cascade, a browser is the final authority.
 */
export const resolveTokenValue = (
  model: ThemeModel,
  name: string,
  axes: Axes,
  depth = 0,
): string | undefined => {
  const token = model.tokens[name];
  const raw = token ? applicableValue(model, token, axes) : undefined;
  return raw === undefined || depth > MAX_DEPTH
    ? undefined
    : substituteReferences(model, raw, axes, depth);
};

const substituteReferences = (
  model: ThemeModel,
  text: string,
  axes: Axes,
  depth: number,
): string | undefined => {
  let result = "";
  let from = 0;
  for (
    let start = text.indexOf("var(", from);
    start !== -1;
    start = text.indexOf("var(", from)
  ) {
    const end = closingParen(text, start + 3);
    if (end === -1) return undefined;
    const args = text.slice(start + 4, end);
    const comma = topLevelComma(args);
    const reference = (comma === -1 ? args : args.slice(0, comma)).trim();
    const fallback = comma === -1 ? undefined : args.slice(comma + 1).trim();
    const value =
      resolveTokenValue(model, reference, axes, depth + 1) ??
      (fallback === undefined
        ? undefined
        : substituteReferences(model, fallback, axes, depth + 1));
    if (value === undefined) return undefined;
    result += text.slice(from, start) + value;
    from = end + 1;
  }
  return (result + text.slice(from)).trim();
};
