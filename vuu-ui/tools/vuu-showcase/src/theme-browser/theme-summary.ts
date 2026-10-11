import type { ThemeModelSummary } from "@vuu-ui/vuu-theme-model/src/summarise-theme-model";
// Generated at build time by `npm run build:theme-model`, alongside the
// (much larger, lazily loaded) theme modules. Not committed, hence ts-ignore.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { summary } from "./generated/vuu-theme.summary.js";

/** Headline figures for vuu-theme, cheap enough to import eagerly */
export const vuuThemeSummary = summary as ThemeModelSummary | undefined;
