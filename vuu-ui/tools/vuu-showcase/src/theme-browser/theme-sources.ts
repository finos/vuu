import type { ComponentModel } from "@vuu-ui/vuu-theme-model/src/component-model-types";
import type { ThemeModel } from "@vuu-ui/vuu-theme-model/src/theme-model-types";

export interface LoadedTheme {
  model: ThemeModel;
  /** the theme flattened to a single stylesheet, without @import/@font-face */
  stylesheet: string;
}

export interface ThemeSource {
  id: string;
  label: string;
  load: () => Promise<LoadedTheme>;
}

// Theme modules are generated at build time from the theme css, by
// `npm run build:theme-model` (see tools/vuu-theme-model). They are not
// committed, hence the ts-ignore.
export const themeSources: ThemeSource[] = [
  {
    id: "vuu-theme",
    label: "vuu-theme",
    load: () =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      import("./generated/vuu-theme.js"),
  },
  {
    id: "salt-theme",
    label: "salt-theme",
    load: () =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      import("./generated/salt-theme.js"),
  },
];

/** components matched to the theme in the tiers view, see theme-browser-components.json */
export const loadComponentModel = (): Promise<{ model: ComponentModel }> =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import("./generated/components.js");
