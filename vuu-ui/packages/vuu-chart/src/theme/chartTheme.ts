/**
 * Chart colours are resolved from CSS custom properties at runtime, so that
 * charts follow the Salt/Vuu theme (including light/dark mode) and work with
 * the canvas renderer (which cannot resolve css var() references itself).
 *
 * All tokens are declared, with Salt-based defaults, in Chart.css on the
 * .vuuChart class and can be overridden in application css.
 */
export interface ChartTheme {
  axisLineColor: string;
  backgroundColor: string;
  crosshairColor: string;
  /** colour of declining candles/bars, negative values, SELL side */
  downColor: string;
  fontFamily: string;
  foregroundColor: string;
  /** low/high colours used for heatmaps */
  heatmapColors: [string, string];
  /** categorical palette, assigned to series in order */
  palette: string[];
  secondaryForegroundColor: string;
  splitLineColor: string;
  tooltipBackgroundColor: string;
  tooltipBorderColor: string;
  /** colour of rising candles/bars, positive values, BUY side */
  upColor: string;
}

export const defaultPalette = [
  "#4676bf",
  "#ab6528",
  "#9f55c2",
  "#2a8285",
  "#697694",
  "#b0549d",
  "#c69d26",
  "#5c8a3a",
];

export const defaultChartTheme: ChartTheme = {
  axisLineColor: "#9fa3a8",
  backgroundColor: "transparent",
  crosshairColor: "#697694",
  downColor: "#e52135",
  fontFamily: "sans-serif",
  foregroundColor: "#15171b",
  heatmapColors: ["#e2ebf8", "#1b4f9c"],
  palette: defaultPalette,
  secondaryForegroundColor: "#5f646d",
  splitLineColor: "#e6e8ea",
  tooltipBackgroundColor: "#ffffff",
  tooltipBorderColor: "#2670a9",
  upColor: "#00875d",
};

const PALETTE_SIZE = 8;

const read = (style: CSSStyleDeclaration, name: string, fallback: string) => {
  const value = style.getPropertyValue(name).trim();
  return value === "" ? fallback : value;
};

/**
 * Read chart theme tokens from the computed style of the chart element.
 */
export const resolveChartTheme = (
  element: HTMLElement | null,
  overrides?: Partial<ChartTheme>,
): ChartTheme => {
  let theme = defaultChartTheme;
  if (element && typeof getComputedStyle === "function") {
    const style = getComputedStyle(element);
    const d = defaultChartTheme;
    const palette: string[] = [];
    for (let i = 0; i < PALETTE_SIZE; i++) {
      palette.push(read(style, `--vuuChart-color-${i + 1}`, d.palette[i]));
    }
    theme = {
      axisLineColor: read(style, "--vuuChart-axisLineColor", d.axisLineColor),
      backgroundColor: read(style, "--vuuChart-background", d.backgroundColor),
      crosshairColor: read(
        style,
        "--vuuChart-crosshairColor",
        d.crosshairColor,
      ),
      downColor: read(style, "--vuuChart-downColor", d.downColor),
      fontFamily: read(style, "--vuuChart-fontFamily", d.fontFamily),
      foregroundColor: read(style, "--vuuChart-foreground", d.foregroundColor),
      heatmapColors: [
        read(style, "--vuuChart-heatmap-lowColor", d.heatmapColors[0]),
        read(style, "--vuuChart-heatmap-highColor", d.heatmapColors[1]),
      ],
      palette,
      secondaryForegroundColor: read(
        style,
        "--vuuChart-secondaryForeground",
        d.secondaryForegroundColor,
      ),
      splitLineColor: read(
        style,
        "--vuuChart-splitLineColor",
        d.splitLineColor,
      ),
      tooltipBackgroundColor: read(
        style,
        "--vuuChart-tooltip-background",
        d.tooltipBackgroundColor,
      ),
      tooltipBorderColor: read(
        style,
        "--vuuChart-tooltip-borderColor",
        d.tooltipBorderColor,
      ),
      upColor: read(style, "--vuuChart-upColor", d.upColor),
    };
  }
  return overrides ? { ...theme, ...overrides } : theme;
};

/**
 * Colour values in declarative chart props may reference theme colours by
 * name: 'up', 'down' or 'palette-n' (1 based).
 */
export const resolveColor = (
  color: string | undefined,
  theme: ChartTheme,
): string | undefined => {
  if (color === "up") {
    return theme.upColor;
  } else if (color === "down") {
    return theme.downColor;
  } else if (color?.startsWith("palette-")) {
    const index = parseInt(color.slice(8), 10) - 1;
    return theme.palette[index % theme.palette.length];
  }
  return color;
};
