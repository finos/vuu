import {
  DENSITIES,
  type PreviewState,
  THEME_OPTIONS,
  type ViewportPreset,
} from "./preview-state";

/**
 * Compare mode renders an example once per combination of two preview
 * settings, the axes, so density, mode and theme regressions can be seen side
 * by side.
 */
export type CompareAxis = "density" | "mode" | "theme";
export type CompareRowAxis = CompareAxis | "none";

/**
 * actual: the example renders at the size of the cell, unscaled.
 * viewport: the example renders at a full viewport width, scaled to fit.
 */
export type CompareSize = "actual" | "viewport";

export interface CompareLayout {
  cols: CompareAxis;
  rows: CompareRowAxis;
  size: CompareSize;
}

export const COMPARE_AXES: CompareAxis[] = ["density", "mode", "theme"];

export const DEFAULT_COMPARE_LAYOUT: CompareLayout = {
  cols: "density",
  rows: "mode",
  size: "actual",
};

export const AXIS_LABELS: Record<CompareRowAxis, string> = {
  density: "Density",
  mode: "Mode",
  none: "None",
  theme: "Theme",
};

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const axisValues = (axis: CompareAxis): string[] =>
  axis === "density"
    ? DENSITIES
    : axis === "mode"
      ? ["light", "dark"]
      : THEME_OPTIONS.map(({ value }) => value);

export const axisValueLabel = (axis: CompareAxis, value: string) =>
  axis === "theme"
    ? (THEME_OPTIONS.find((option) => option.value === value)?.label ?? value)
    : capitalise(value);

const isAxis = (value: unknown): value is CompareAxis =>
  COMPARE_AXES.includes(value as CompareAxis);

/**
 * The layout from url params, cols and rows. The two axes are always
 * different, an invalid or clashing rows axis falls back to the first free
 * axis.
 */
export const readCompareLayout = (params: URLSearchParams): CompareLayout => {
  const colsParam = params.get("cols");
  const rowsParam = params.get("rows");
  const cols = isAxis(colsParam) ? colsParam : DEFAULT_COMPARE_LAYOUT.cols;
  const rows: CompareRowAxis =
    rowsParam === "none"
      ? "none"
      : isAxis(rowsParam) && rowsParam !== cols
        ? rowsParam
        : (["mode", "density", "theme"] as CompareAxis[]).find(
            (axis) => axis !== cols,
          )!;
  const size: CompareSize =
    params.get("size") === "viewport" ? "viewport" : "actual";
  return { cols, rows, size };
};

export const writeCompareLayout = (
  params: URLSearchParams,
  layout: CompareLayout,
) => {
  const next = new URLSearchParams(params);
  next.set("cols", layout.cols);
  next.set("rows", layout.rows);
  if (layout.size === "actual") {
    next.delete("size");
  } else {
    next.set("size", layout.size);
  }
  return next;
};

/** Changing one axis to the value of the other swaps them */
export const changeCompareAxis = (
  layout: CompareLayout,
  which: "cols" | "rows",
  axis: CompareRowAxis,
): CompareLayout => {
  if (which === "cols") {
    if (axis === "none") {
      return layout;
    }
    return axis === layout.rows
      ? { ...layout, cols: axis, rows: layout.cols }
      : { ...layout, cols: axis };
  }
  return axis === layout.cols
    ? layout.rows === "none"
      ? layout
      : { ...layout, cols: layout.rows, rows: axis }
    : { ...layout, rows: axis };
};

export interface CompareCell {
  col: string;
  key: string;
  row?: string;
  state: PreviewState;
}

/**
 * The cells of the matrix, in reading order. Settings that are not an axis
 * come from the preview state. Data consuming examples always use the local
 * simulator, so every cell ticks independently of any server.
 */
export const compareCells = (
  preview: PreviewState,
  { cols, rows }: CompareLayout,
): CompareCell[] => {
  const rowValues = rows === "none" ? [undefined] : axisValues(rows);
  return rowValues.flatMap((row) =>
    axisValues(cols).map((col) => {
      const state: PreviewState = { ...preview, ds: "local", [cols]: col };
      if (rows !== "none" && row !== undefined) {
        Object.assign(state, { [rows]: row });
      }
      return {
        col,
        key: `${row ?? ""}:${col}`,
        row,
        state,
      };
    }),
  );
};

/** Height of a cell at actual size */
export const COMPARE_CELL_HEIGHT = 360;
/** In viewport size, cells render at a virtual viewport, scaled to fit */
export const COMPARE_VIEWPORT_HEIGHT = 640;
const DEFAULT_COMPARE_VIEWPORT_WIDTH = 1024;

export const compareViewportWidth = (vp: ViewportPreset) =>
  vp === "fill" ? DEFAULT_COMPARE_VIEWPORT_WIDTH : Number(vp);

export const compareScale = (cellWidth: number, viewportWidth: number) =>
  cellWidth > 0 ? Math.min(1, cellWidth / viewportWidth) : 0;
