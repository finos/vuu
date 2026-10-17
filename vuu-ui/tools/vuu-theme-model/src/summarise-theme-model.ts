import {
  THEME_TIERS,
  type ThemeModel,
  type ThemeTier,
} from "./theme-model-types.ts";

/**
 * A small digest of a theme model, for consumers that want headline figures
 * without loading the (large) model itself.
 */
export interface ThemeModelSummary {
  name: string;
  /** tokens of the theme proper, excluding legacy fallbacks */
  tokenCount: number;
  tokensByTier: Record<ThemeTier, number>;
  axes: { name: string; values: string[] }[];
  scopeCount: number;
}

export const summariseThemeModel = (model: ThemeModel): ThemeModelSummary => {
  const tokens = Object.values(model.tokens).filter(
    (token) => token.layer !== "legacy",
  );
  const tokensByTier = Object.fromEntries(
    THEME_TIERS.map((tier) => [
      tier,
      tokens.filter((token) => token.tier === tier).length,
    ]),
  ) as Record<ThemeTier, number>;
  return {
    axes: model.axes.map(({ name, values }) => ({ name, values })),
    name: model.name,
    scopeCount: model.scopes.length,
    tokenCount: tokens.length,
    tokensByTier,
  };
};
