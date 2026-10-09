import type {
  ThemeToken,
  TokenCategory,
  ValueKind,
} from "./theme-model-types.ts";

/**
 * Ordered name patterns, matched against the token name (minus prefix).
 * First match wins.
 */
const NAME_PATTERNS: Array<[RegExp, TokenCategory]> = [
  [/(^|-)zIndex(-|$)/i, "z-index"],
  [/(^|-)cursor(-|$)/, "cursor"],
  [/(^|-)borderStyle(-|$)/, "border-style"],
  [/(^|-)duration(-|$)/, "duration"],
  [/timing-function|(^|-)easing(-|$)/, "easing"],
  [/(^|-)animation(-|$)/, "animation"],
  [/(^|-)shadow(-|$)/, "shadow"],
  [/(^|-)fontFamily(-|$)/, "font-family"],
  [/(^|-)fontWeight(-|$)/, "font-weight"],
  [
    /(^|-)(fontSize|lineHeight|letterSpacing|textAlign|textDecoration|textTransform|fontStyle)(-|$)/,
    "typography",
  ],
  [/(^|-)opacity(-|$)/, "opacity"],
  [
    /(^|-)(color|background|foreground|borderColor|outlineColor|fill|stroke)(-|$)/,
    "color",
  ],
];

const fromName = (name: string): TokenCategory | undefined => {
  const bareName = name.replace(/^--/, "");
  for (const [pattern, category] of NAME_PATTERNS) {
    if (pattern.test(bareName)) return category;
  }
  return undefined;
};

const fromKinds = (kinds: Set<ValueKind>): TokenCategory | undefined => {
  if (kinds.has("color-channels")) return "color-channels";
  if (kinds.has("color")) return "color";
  return undefined;
};

const fromScalarKinds = (kinds: Set<ValueKind>): TokenCategory | undefined => {
  if (kinds.has("dimension") || kinds.has("calc")) return "dimension";
  if (kinds.has("number") || kinds.has("percentage")) return "number";
  return undefined;
};

const isAlias = (token: ThemeToken) =>
  token.values.every((v) => v.kind === "reference");

/**
 * Assign a category to every token. Explicit value kinds (e.g. a literal
 * color) take precedence, then name conventions, then categories inherited
 * through aliases (var references), and finally scalar value kinds.
 */
export const assignCategories = (tokens: Map<string, ThemeToken>) => {
  const pending = new Set<ThemeToken>();

  for (const token of tokens.values()) {
    const kinds = new Set(token.values.map((v) => v.kind));
    const category = fromKinds(kinds) ?? fromName(token.name);
    if (category) {
      token.category = category;
    } else {
      pending.add(token);
    }
  }

  // propagate through aliases until no further progress is made
  const propagate = () => {
    let progress = true;
    while (progress && pending.size > 0) {
      progress = false;
      for (const token of pending) {
        if (!isAlias(token)) continue;
        const inherited = token.references
          .map((ref) => tokens.get(ref))
          .find((ref) => ref && !pending.has(ref));
        if (inherited) {
          token.category = inherited.category;
          pending.delete(token);
          progress = true;
        }
      }
    }
  };

  propagate();

  for (const token of pending) {
    if (!isAlias(token)) {
      const kinds = new Set(token.values.map((v) => v.kind));
      token.category = fromScalarKinds(kinds) ?? "other";
      pending.delete(token);
    }
  }

  propagate();

  for (const token of pending) {
    token.category = "other";
  }
};
