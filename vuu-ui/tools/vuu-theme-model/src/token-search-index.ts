import { type Axes, resolveTokenValue } from "./resolve-token.ts";
import type {
  ThemeModel,
  ThemeTier,
  TokenCategory,
} from "./theme-model-types.ts";

/**
 * A compact, search oriented digest of the tokens of a theme, with values
 * resolved for light and dark mode, so a token can be presented without
 * loading the (large) model.
 */
export interface TokenSearchEntry {
  name: string;
  tier: ThemeTier;
  category: TokenCategory;
  /** source file base name, e.g "actionable" */
  group: string;
  /** the token this one aliases, if its value is a single var() */
  alias?: string;
  light?: string;
  dark?: string;
}

const MAX_VALUE_LENGTH = 80;

const AXIS_DEFAULTS: Axes = { density: "medium", mode: "light" };

export const defaultAxes = (model: ThemeModel): Axes =>
  Object.fromEntries(
    model.axes.map(({ name, values }) => [
      name,
      values.includes(AXIS_DEFAULTS[name]) ? AXIS_DEFAULTS[name] : values[0],
    ]),
  );

const clip = (value?: string) =>
  value && value.length > MAX_VALUE_LENGTH
    ? `${value.slice(0, MAX_VALUE_LENGTH - 1)}…`
    : value;

export const buildTokenSearchIndex = (
  model: ThemeModel,
): TokenSearchEntry[] => {
  const light = { ...defaultAxes(model), mode: "light" };
  const dark = { ...light, mode: "dark" };
  return Object.values(model.tokens)
    .filter((token) => token.layer !== "legacy")
    .map((token) => {
      const entry: TokenSearchEntry = {
        category: token.category,
        group: token.group,
        name: token.name,
        tier: token.tier,
      };
      const [first] = token.values;
      if (
        first?.kind === "reference" &&
        token.values.every((v) => v.raw === first.raw)
      ) {
        entry.alias = first.references[0];
      }
      const lightValue = clip(resolveTokenValue(model, token.name, light));
      const darkValue = clip(resolveTokenValue(model, token.name, dark));
      if (lightValue !== undefined) entry.light = lightValue;
      if (darkValue !== undefined && darkValue !== lightValue) {
        entry.dark = darkValue;
      }
      return entry;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};
