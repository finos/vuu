import { DataSourceValue } from "./ChartSeries";

export interface TooltipParams {
  axisValueLabel: string;
  color: string;
  componentType: string;
  componentSubType: string;
  data: DataSourceValue;
  seriesName: string;
  seriesType: "line" | "scatter";
  value: number;
}

/**
 * Returns the name of the series whose data point is under the pointer, if
 * any. Its tooltip entry is emphasised, so the user can tell which series
 * they are hovering when series colours are similar.
 */
export type HoveredSeriesGetter = () => string | undefined;

export const createChartTooltip =
  (getHoveredSeries: HoveredSeriesGetter) => (params: TooltipParams[]) => {
    if (params.length > 0) {
      const [{ axisValueLabel }] = params;
      const hoveredSeries = getHoveredSeries();

      const tooltipEntries = params
        .filter(({ seriesType }) => seriesType === "line")
        .map(({ color, seriesName, value }) => {
          const className =
            seriesName === hoveredSeries
              ? "vuuChart-tooltip-entry vuuChart-tooltip-entry-hovered"
              : "vuuChart-tooltip-entry";
          return [
            `<div class="${className}">`,
            `<span class="vuuChart-tooltip-icon" style="background:${color};"></span>`,
            `<span class="vuuChart-tooltip-label">${seriesName}</span>`,
            `<span class="vuuChart-tooltip-value">${value ?? "n/a"}</span>`,
            "</div>",
          ].join("");
        });

      return [
        `<div class="vuuChart-tooltip-title">${axisValueLabel}</div>`,
        '<div class="vuuChart-tooltip-container">',
      ]
        .concat(tooltipEntries)
        .concat("</div>")
        .join("");
    }
  };
