/**
 * Serialisable model of a Salt theme, produced at build time and consumed by
 * the Theme Browser (and, in future, a theme editor / VS Code extension).
 *
 * This file must remain free of imports so that it can be consumed from any
 * environment (browser, node, extension host).
 */

export const THEME_MODEL_SCHEMA_VERSION = 1;

export type ThemeTier = "foundations" | "palette" | "characteristics";

export const THEME_TIERS: readonly ThemeTier[] = [
  "foundations",
  "palette",
  "characteristics",
];

/**
 * shared - files common to legacy and next themes (e.g. css/foundations)
 * next   - files under css/next
 * legacy - not part of the theme proper, but declared in a fallback source
 *          (e.g. legacy theme.css) and referenced by shared or next tokens
 */
export type ThemeLayer = "shared" | "next" | "legacy";

export interface SourceLocation {
  /** path of source file, relative to the theme css root */
  file: string;
  line: number;
  column: number;
}

/**
 * The structural kind of a declared value, as written in source.
 */
export type ValueKind =
  | "reference" // var(--x) and nothing else, i.e an alias
  | "color"
  | "color-channels" // e.g 255, 255, 255 (used inside rgb(var(--x)))
  | "dimension"
  | "number"
  | "percentage"
  | "string"
  | "keyword"
  | "calc"
  | "composite"; // anything else, e.g. shadow, animation shorthand

/**
 * Semantic category of a token, used to choose an appropriate visualisation.
 */
export type TokenCategory =
  | "color"
  | "color-channels"
  | "dimension"
  | "number"
  | "font-family"
  | "font-weight"
  | "typography"
  | "shadow"
  | "duration"
  | "easing"
  | "animation"
  | "opacity"
  | "z-index"
  | "cursor"
  | "border-style"
  | "other";

/**
 * A Scope describes the conditions under which a declaration applies. Salt
 * themes use class and data-attribute selectors to express theme 'axes' such
 * as mode, density, accent and corner.
 */
export interface ThemeScope {
  /** canonical, quote-insensitive identifier */
  id: string;
  /** selector as first encountered in source */
  selector: string;
  /** axis name => axis value, e.g { mode: "dark", density: "high" } */
  conditions: Record<string, string>;
  /** classes that are not axis-related, e.g salt-theme, salt-theme-next */
  classes: string[];
  /** at-rule preludes wrapping the rule, e.g "media (min-width: 600px)" */
  atRules?: string[];
  /** true if the selector uses combinators, pseudo classes etc */
  complex?: boolean;
}

export interface ThemeAxis {
  /** e.g mode, density, accent, corner, heading-font */
  name: string;
  /** source attribute or class pattern, e.g data-mode or .salt-density-* */
  source: string;
  values: string[];
}

export interface TokenValue {
  scopeId: string;
  /** value text exactly as written in source */
  raw: string;
  kind: ValueKind;
  /** custom properties referenced via var() in this value */
  references: string[];
  location: SourceLocation;
}

export interface ThemeToken {
  name: string;
  /** e.g "salt" for --salt-palette-accent */
  prefix: string;
  /** name minus prefix, split on '-', e.g ["palette", "accent", "strong"] */
  segments: string[];
  tier: ThemeTier;
  layer: ThemeLayer;
  /** source file base name, e.g "actionable" for actionable.css */
  group: string;
  category: TokenCategory;
  values: TokenValue[];
  /** union of tokens referenced across all values (downstream) */
  references: string[];
  /** tokens whose values reference this token (upstream) */
  referencedBy: string[];
}

export interface ThemeGroup {
  name: string;
  tier: ThemeTier;
  layer: ThemeLayer;
  file: string;
  tokens: string[];
}

export type DiagnosticType =
  | "unresolved-reference"
  | "overridden-in-scope"
  | "declared-in-multiple-files"
  | "complex-selector"
  | "parse-error";

export interface ThemeDiagnostic {
  type: DiagnosticType;
  message: string;
  token?: string;
  location?: SourceLocation;
}

export interface ThemeModel {
  schemaVersion: typeof THEME_MODEL_SCHEMA_VERSION;
  name: string;
  /** entry file, relative to the theme css root */
  entry: string;
  axes: ThemeAxis[];
  scopes: ThemeScope[];
  groups: Record<ThemeTier, ThemeGroup[]>;
  tokens: Record<string, ThemeToken>;
  diagnostics: ThemeDiagnostic[];
}
