import type { ChartTheme } from "../theme/chartTheme";
import { resolveColor } from "../theme/chartTheme";
import { computeMarkLineValue } from "../chart-data/projection-utils";
import type {
  DataZoomOption,
  LegendPosition,
  MarkLineDef,
} from "../vuu-chart-types";

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/**
 * Format an epoch millisecond timestamp for an axis label. Shows seconds
 * only when present, date only at midnight.
 */
export const formatTimeLabel = (ts: number) => {
  if (!Number.isFinite(ts)) {
    return "";
  }
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  if (h === 0 && m === 0 && s === 0) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return s === 0 ? `${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const formatTimestamp = (ts: number) => {
  if (!Number.isFinite(ts)) {
    return "";
  }
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const textStyle = (theme: ChartTheme) => ({
  color: theme.foregroundColor,
  fontFamily: theme.fontFamily,
});

// Axis label sizes are estimated from sample labels, which can under-estimate
// the widest label once data arrives. Keep a small margin inside the canvas.
export const GRID_OUTER_BOUNDS = { left: 4, right: 12, top: 0, bottom: 0 };

export const axisStyle = (theme: ChartTheme, showSplitLine = true) => ({
  axisLine: { lineStyle: { color: theme.axisLineColor } },
  axisTick: { lineStyle: { color: theme.axisLineColor } },
  axisLabel: {
    color: theme.secondaryForegroundColor,
    fontFamily: theme.fontFamily,
    hideOverlap: true,
  },
  nameTextStyle: {
    color: theme.secondaryForegroundColor,
    fontFamily: theme.fontFamily,
  },
  splitLine: {
    show: showSplitLine,
    lineStyle: { color: theme.splitLineColor },
  },
});

export const axisPointerLabel = (theme: ChartTheme) => ({
  backgroundColor: theme.crosshairColor,
  color: theme.tooltipBackgroundColor,
  fontFamily: theme.fontFamily,
});

export const tooltipOption = (
  theme: ChartTheme,
  {
    crosshair = true,
    show = true,
    trigger = "axis",
  }: { crosshair?: boolean; show?: boolean; trigger?: "axis" | "item" } = {},
) => ({
  show,
  trigger,
  confine: true,
  className: "vuuChartTooltip",
  backgroundColor: theme.tooltipBackgroundColor,
  borderColor: theme.tooltipBorderColor,
  textStyle: { ...textStyle(theme), fontSize: 12 },
  axisPointer:
    trigger === "axis"
      ? {
          type: crosshair ? "cross" : "line",
          lineStyle: { color: theme.crosshairColor, type: "dashed" },
          crossStyle: { color: theme.crosshairColor },
          label: axisPointerLabel(theme),
        }
      : undefined,
});

export const legendOption = (theme: ChartTheme, position: LegendPosition) =>
  position === "none"
    ? { show: false }
    : {
        show: true,
        type: "scroll",
        [position]: 0,
        textStyle: {
          color: theme.secondaryForegroundColor,
          fontFamily: theme.fontFamily,
        },
        pageTextStyle: { color: theme.secondaryForegroundColor },
      };

export const hasSlider = (dataZoom: DataZoomOption | undefined) =>
  dataZoom === "slider" || dataZoom === "both";

export const dataZoomOption = (
  dataZoom: DataZoomOption | undefined,
  theme: ChartTheme,
  axisIndex: number[] = [0],
  orientation: "x" | "y" = "x",
) => {
  if (!dataZoom) {
    return [];
  }
  const axisKey = orientation === "x" ? "xAxisIndex" : "yAxisIndex";
  const zoom: Record<string, unknown>[] = [];
  if (dataZoom === true || dataZoom === "inside" || dataZoom === "both") {
    zoom.push({
      id: "zoom-inside",
      type: "inside",
      [axisKey]: axisIndex,
      filterMode: "filter",
    });
  }
  if (hasSlider(dataZoom)) {
    zoom.push({
      id: "zoom-slider",
      type: "slider",
      [axisKey]: axisIndex,
      height: 20,
      bottom: 4,
      borderColor: theme.axisLineColor,
      backgroundColor: "transparent",
      fillerColor: "rgba(127,127,127,0.15)",
      dataBackground: {
        lineStyle: { color: theme.axisLineColor },
        areaStyle: { color: theme.splitLineColor },
      },
      handleStyle: {
        color: theme.tooltipBackgroundColor,
        borderColor: theme.axisLineColor,
      },
      moveHandleStyle: { color: theme.axisLineColor },
      textStyle: { color: theme.secondaryForegroundColor },
      filterMode: "filter",
    });
  }
  return zoom;
};

const formatMarkLineValue = (value: number) =>
  Math.abs(value) >= 1000
    ? value.toFixed(0)
    : Number(value.toPrecision(6)).toString();

/**
 * Build a series markLine option from declarative mark line definitions.
 * Values are computed from the current series values, so this is rebuilt
 * on each data update.
 */
export const markLineOption = (
  defs: MarkLineDef[] | undefined,
  theme: ChartTheme,
  values: Array<number | null>,
  {
    axis = "yAxis",
    defaultColor,
    weights,
  }: {
    axis?: "xAxis" | "yAxis";
    defaultColor?: string;
    weights?: Array<number | null>;
  } = {},
) => {
  if (!defs || defs.length === 0) {
    return undefined;
  }
  const data = [];
  for (const def of defs) {
    const value = computeMarkLineValue(def, values, weights);
    if (value !== null) {
      const color =
        resolveColor(def.color, theme) ?? defaultColor ?? theme.crosshairColor;
      data.push({
        name: def.label ?? "",
        [axis]: value,
        lineStyle: { color, type: def.lineType ?? "dashed", width: 1 },
        label: {
          color: theme.tooltipBackgroundColor,
          backgroundColor: color,
          padding: [2, 4],
          borderRadius: 2,
          position: def.labelPosition ?? "insideEndTop",
          formatter: def.label
            ? `${def.label} ${formatMarkLineValue(value)}`
            : formatMarkLineValue(value),
        },
      });
    }
  }
  return {
    silent: true,
    symbol: ["none", "none"],
    animation: false,
    data,
  };
};
