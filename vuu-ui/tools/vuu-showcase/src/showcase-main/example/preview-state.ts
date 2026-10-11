export type Density = "high" | "medium" | "low" | "touch";
export type ThemeMode = "light" | "dark";
export type DataLocation = "local" | "remote";
export type ViewportPreset = "fill" | "1440" | "1024" | "768";

export interface PreviewState {
  /** data source, data consuming examples only */
  ds: DataLocation;
  density: Density;
  mode: ThemeMode;
  theme: string;
  /** width of the preview frame */
  vp: ViewportPreset;
}

export type PreviewParam = keyof PreviewState;

export interface ThemeOption {
  label: string;
  value: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { label: "Vuu", value: "vuu-theme" },
  { label: "Salt", value: "salt-theme-next" },
  { label: "No theme", value: "no-theme" },
];

export const DENSITIES: Density[] = ["high", "medium", "low", "touch"];
export const VIEWPORT_PRESETS: ViewportPreset[] = [
  "fill",
  "1440",
  "1024",
  "768",
];
const DATA_LOCATIONS: DataLocation[] = ["local", "remote"];
const MODES: ThemeMode[] = ["light", "dark"];

export const DEFAULT_PREVIEW_STATE: PreviewState = {
  density: "high",
  ds: "local",
  mode: "light",
  theme: "vuu-theme",
  vp: "fill",
};

export const PREVIEW_PARAMS = Object.keys(
  DEFAULT_PREVIEW_STATE,
) as PreviewParam[];

const isOneOf = <T extends string>(
  values: readonly T[],
  value: unknown,
): value is T => values.includes(value as T);

const validators: { [K in PreviewParam]: (value: unknown) => boolean } = {
  density: (value) => isOneOf(DENSITIES, value),
  ds: (value) => isOneOf(DATA_LOCATIONS, value),
  mode: (value) => isOneOf(MODES, value),
  theme: (value) => THEME_OPTIONS.some((option) => option.value === value),
  vp: (value) => isOneOf(VIEWPORT_PRESETS, value),
};

/** Valid values from a partial, untrusted, state. Invalid values are dropped */
export const sanitisePreviewState = (
  input: Record<string, unknown>,
): Partial<PreviewState> => {
  const state: Partial<PreviewState> = {};
  for (const param of PREVIEW_PARAMS) {
    const value = input[param];
    if (validators[param](value)) {
      (state as Record<string, unknown>)[param] = value;
    }
  }
  return state;
};

/**
 * Preview state is primarily held in the url, so any configuration can be
 * shared. Params absent from the url fall back to the user's preferences,
 * so settings follow the user from one example to the next.
 */
export const readPreviewState = (
  params: URLSearchParams,
  preferences: Partial<PreviewState> = {},
): PreviewState => ({
  ...DEFAULT_PREVIEW_STATE,
  ...sanitisePreviewState(preferences),
  ...sanitisePreviewState(Object.fromEntries(params)),
});

/** Sets the given preview state values as url params, others are preserved */
export const writePreviewParams = (
  params: URLSearchParams,
  state: Partial<PreviewState>,
) => {
  const nextParams = new URLSearchParams(params);
  for (const param of PREVIEW_PARAMS) {
    const value = state[param];
    if (value !== undefined) {
      nextParams.set(param, value);
    }
  }
  return nextParams;
};

/** The iframe contract understood by ShowcaseStandalone (unchanged) */
export const standaloneUrl = (
  pathname: string,
  { density, ds, mode, theme }: PreviewState,
  anchor?: string | null,
) => {
  const anchorParam = anchor ? `&anchor=${encodeURIComponent(anchor)}` : "";
  return `${pathname}?standalone&theme=${theme}${anchorParam}#themeMode=${mode},density=${density},dataLocation=${ds}`;
};

const PREFERENCES_KEY = "vuu-showcase.preview";

export const loadPreviewPreferences = (): Partial<PreviewState> => {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}");
    return value && typeof value === "object"
      ? sanitisePreviewState(value)
      : {};
  } catch {
    return {};
  }
};

export const storePreviewPreferences = (state: Partial<PreviewState>) => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable, preferences last for this session only
  }
};
