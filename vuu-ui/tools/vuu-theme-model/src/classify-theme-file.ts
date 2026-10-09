import type { ThemeLayer, ThemeTier } from "./theme-model-types.ts";

export interface FileClassification {
  tier: ThemeTier;
  layer: ThemeLayer;
  group: string;
}

const TIERS = new Set<string>(["foundations", "palette", "characteristics"]);
const EXCLUDED_SEGMENTS = new Set(["deprecated", "components"]);

/**
 * Classify a theme source file by its path. Only the shared foundations and
 * the 'next' theme files are of interest. Legacy palette and characteristics
 * (those outside the next folder) and anything deprecated are excluded.
 *
 *   foundations/size.css               => foundations (shared)
 *   next/foundations/color.css         => foundations (next)
 *   next/palette/accent.css            => palette     (next)
 *   next/characteristics/actionable.css=> characteristics (next)
 *   palette/accent.css                 => excluded (legacy)
 *   legacy/palette/accent.css          => excluded (legacy)
 *   next/deprecated/palette.css        => excluded
 *
 * Legacy files may be admitted (with layer 'legacy') via allowLegacy, this
 * is used when resolving references from fallback sources.
 */
export const classifyThemeFile = (
  filePath: string,
  { allowLegacy = false } = {},
): FileClassification | undefined => {
  const segments = filePath.split("/").filter(Boolean);
  const fileName = segments.pop();
  if (!fileName?.endsWith(".css")) return undefined;
  if (segments.some((s) => EXCLUDED_SEGMENTS.has(s))) return undefined;

  const tierIndex = segments.findLastIndex((s) => TIERS.has(s));
  if (tierIndex === -1) return undefined;

  const tier = segments[tierIndex] as ThemeTier;
  const parents = segments.slice(0, tierIndex);
  const group = fileName.replace(/\.css$/, "");

  const isLegacy =
    parents.includes("legacy") ||
    // older Salt themes keep legacy palette/characteristics at the top level
    (!parents.includes("next") && tier !== "foundations");

  if (isLegacy) {
    return allowLegacy ? { tier, layer: "legacy", group } : undefined;
  }

  const layer: ThemeLayer = parents.includes("next") ? "next" : "shared";
  return { tier, layer, group };
};
