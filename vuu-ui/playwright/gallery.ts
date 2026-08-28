import type { Page } from "@playwright/test";

type GalleryOptions = {
  density?: "high" | "medium" | "low" | "touch";
  theme?: "salt-theme-next" | "vuu-theme";
  themeMode?: "light" | "dark";
};

export const galleryExampleUrl = (
  examplePath: string,
  {
    density = "medium",
    theme = "vuu-theme",
    themeMode = "light",
  }: GalleryOptions = {},
) =>
  `/${examplePath}?standalone&theme=${theme}#themeMode=${themeMode},density=${density}`;

export const gotoGalleryExample = (
  page: Page,
  examplePath: string,
  options?: GalleryOptions,
) => page.goto(galleryExampleUrl(examplePath, options));
