import type {
  DiagnosticType,
  ThemeModel,
  ThemeScope,
  ThemeTier,
  ThemeToken,
  TokenValue,
} from "@vuu-ui/vuu-theme-model/src/theme-model-types";

export type Axes = Record<string, string>;

export const TIERS: ThemeTier[] = ["foundations", "palette", "characteristics"];

export const TIER_INFO: Record<ThemeTier, { label: string; blurb: string }> = {
  foundations: {
    label: "Foundations",
    blurb: "Raw values – colour ramps, sizes, spacing, type",
  },
  palette: {
    label: "Palette",
    blurb: "Foundations refined into a mode-aware colour system",
  },
  characteristics: {
    label: "Characteristics",
    blurb: "Intent-based tokens consumed by components",
  },
};

export const DIAGNOSTIC_INFO: Record<
  DiagnosticType,
  { label: string; blurb: string }
> = {
  "unresolved-reference": {
    label: "Unresolved references",
    blurb: "var() references to tokens the theme never declares",
  },
  "overridden-in-scope": {
    label: "Overridden in scope",
    blurb: "a later declaration replaces an earlier one, same selector",
  },
  "declared-in-multiple-files": {
    label: "Declared in multiple files",
    blurb: "a token is defined in more than one source file",
  },
  "complex-selector": {
    label: "Complex selectors",
    blurb: "selectors that cannot be mapped to theme axes",
  },
  "parse-error": {
    label: "Parse errors",
    blurb: "css that could not be parsed",
  },
};

/** Axes offered as segmented toggles, in display order */
export const PRIMARY_AXES = ["mode", "density", "accent", "corner"];

const AXIS_DEFAULTS: Axes = { density: "medium", mode: "light" };

export const defaultAxes = (model: ThemeModel): Axes =>
  Object.fromEntries(
    model.axes.map(({ name, values }) => [
      name,
      values.includes(AXIS_DEFAULTS[name]) ? AXIS_DEFAULTS[name] : values[0],
    ]),
  );

export const RAMP_PATTERN = /^color-([a-z]+)-(\d+)$/;

export const rampOf = (token: ThemeToken) => {
  if (token.category !== "color") return undefined;
  const match = RAMP_PATTERN.exec(token.segments.join("-"));
  return match ? { hue: match[1], step: Number(match[2]) } : undefined;
};

export type ChainStep =
  | { token: ThemeToken; value?: TokenValue; missing?: never }
  | { missing: string; token?: never; value?: never };

/**
 * Indexes a model for queries that depend on the current theme axes. Only
 * simple scopes (classes and axis conditions) are considered, scopes with
 * combinators or at-rules cannot be evaluated against axes alone.
 */
export class ThemeIndex {
  readonly rootClasses: string[];
  readonly #scopes: Map<string, ThemeScope>;

  constructor(readonly model: ThemeModel) {
    this.#scopes = new Map(model.scopes.map((scope) => [scope.id, scope]));
    this.rootClasses = [
      ...new Set(
        model.scopes
          .filter((scope) => !scope.complex && !scope.atRules)
          .flatMap((scope) => scope.classes),
      ),
    ];
  }

  token(name: string): ThemeToken | undefined {
    return this.model.tokens[name];
  }

  scope(id: string) {
    return this.#scopes.get(id);
  }

  scopeMatches(scope: ThemeScope, axes: Axes) {
    return (
      !scope.complex &&
      !scope.atRules &&
      scope.classes.every((c) => this.rootClasses.includes(c)) &&
      Object.entries(scope.conditions).every(([k, v]) => axes[k] === v)
    );
  }

  /** the value that applies under the given axes, most specific scope wins */
  activeValue(token: ThemeToken, axes: Axes) {
    let best: TokenValue | undefined;
    let bestWeight = -1;
    for (const value of token.values) {
      const scope = this.scope(value.scopeId);
      if (!scope || !this.scopeMatches(scope, axes)) continue;
      const weight =
        scope.classes.length + Object.keys(scope.conditions).length;
      if (weight >= bestWeight) {
        best = value;
        bestWeight = weight;
      }
    }
    return best;
  }

  /** resolution chain, following the first reference at each step */
  chainOf(name: string, axes: Axes): ChainStep[] {
    const chain: ChainStep[] = [];
    const seen = new Set<string>();
    let current = this.token(name);
    while (current && !seen.has(current.name)) {
      seen.add(current.name);
      const value = this.activeValue(current, axes);
      chain.push({ token: current, value });
      const next = value?.references[0];
      current = next ? this.token(next) : undefined;
      if (next && !current) {
        chain.push({ missing: next });
      }
    }
    return chain;
  }

  /** axes along which a token's declared values vary */
  varyingAxes(token: ThemeToken) {
    return this.model.axes.filter((axis) =>
      token.values.some(
        (value) => this.scope(value.scopeId)?.conditions[axis.name],
      ),
    );
  }

  search(query: string, limit = 30) {
    const terms = query
      .trim()
      .toLowerCase()
      .replace(/^-*/, "")
      .split(/[\s-]+/)
      .filter(Boolean);
    if (terms.length === 0) return [];
    const phrase = terms.join("-");
    const scored: { token: ThemeToken; score: number }[] = [];
    for (const token of Object.values(this.model.tokens)) {
      const name = token.name.toLowerCase();
      if (!terms.every((term) => name.includes(term))) continue;
      const short = token.segments.join("-").toLowerCase();
      const index = name.indexOf(phrase);
      const score =
        (short.startsWith(phrase) ? 0 : 1000) +
        (index === -1 ? 500 : index) +
        name.length / 100;
      scored.push({ token, score });
    }
    return scored
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map(({ token }) => token);
  }
}

// ---------------------------------------------------------------------------
// characteristics
// ---------------------------------------------------------------------------

const PROPERTIES = new Set([
  "background",
  "foreground",
  "borderColor",
  "borderStyle",
  "borderWidth",
  "outline",
  "outlineColor",
  "outlineStyle",
  "outlineWidth",
  "outlineOffset",
  "fontWeight",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textDecoration",
  "textTransform",
  "cursor",
  "shadow",
  "fill",
  "color",
  "separatorColor",
  "indicator",
]);

const STATE_ORDER = [
  "",
  "hover",
  "active",
  "selected",
  "selectedDisabled",
  "disabled",
  "readonly",
];

export const stateRank = (state: string) =>
  STATE_ORDER.indexOf(state) + 1 || 99;

/** characteristic tokens follow --salt-{group}-{variant}-{property}-{state} */
export const parseCharacteristic = (token: ThemeToken) => {
  const [, ...rest] = token.segments;
  const propIndex = rest.findIndex((s) => PROPERTIES.has(s));
  if (propIndex === -1) {
    return {
      variant: rest.slice(0, -1).join("-"),
      property: rest.at(-1) ?? "",
      state: "",
    };
  }
  return {
    variant: rest.slice(0, propIndex).join("-"),
    property: rest[propIndex],
    state: rest.slice(propIndex + 1).join("-"),
  };
};

// ---------------------------------------------------------------------------
// formatting
// ---------------------------------------------------------------------------

export const shortName = (token: ThemeToken) => {
  const segments = [...token.segments];
  if (token.tier === "palette" && segments[0] === "palette") segments.shift();
  return segments.join("-");
};

export const toHex = (value: string) => {
  const match =
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(
      value,
    );
  if (!match) return value;
  const hex = [match[1], match[2], match[3]]
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  if (match[4] !== undefined) {
    const alpha = match[4].endsWith("%")
      ? parseFloat(match[4]) / 100
      : Number(match[4]);
    if (alpha < 1) return `#${hex} · ${Math.round(alpha * 100)}%`;
  }
  return `#${hex}`;
};

export const displayValue = (token: ThemeToken, value: string) => {
  if (!value) return "—";
  if (token.category === "color") return toHex(value);
  if (token.category === "color-channels") return toHex(`rgb(${value})`);
  return value.replace(/\s+/g, " ");
};

export const isRadius = (token: ThemeToken) =>
  /curve|corner|radius/i.test(token.group + token.name);

/** black or white, whichever reads better on the given rgb() colour */
export const readableOn = (rgb: string) => {
  const [r = 0, g = 0, b = 0] = (rgb.match(/[\d.]+/g) ?? []).map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#000" : "#fff";
};

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const variantLabel = (variant: string) =>
  variant ? variant.replace(/-/g, " ") : "default";

export const withoutPrefix = (name: string) => name.replace(/^--salt-/, "");
