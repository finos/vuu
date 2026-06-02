import { type EChartsCoreOption } from "echarts";
import { useMemo, useState } from "react";
import { ChartSeries, ItemColorFunction } from "./ChartSeries";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { itemsChanged } from "@vuu-ui/vuu-utils";

const defaultPalette = [
  "#4676bf",
  "#ab6528",
  "#9f55c2",
  "#2a8285",
  "#697694",
  "#B0549d",
];
export interface ChartOptionsProps {
  categoryColumnName: string;
  dataSource: DataSource;
  itemColorFunction?: ItemColorFunction;
  palette?: string[];
  seriesColumnNames: string[];
  showTooltip?: boolean;
}

export const useChartOptions = ({
  categoryColumnName,
  dataSource,
  itemColorFunction,
  palette = defaultPalette,
  seriesColumnNames,
  showTooltip = true,
}: ChartOptionsProps) => {
  const [, forceRender] = useState({});

  const chartSeries = useMemo(() => {
    console.log("new ChartSeries");
    const cs = new ChartSeries({
      itemColorFunction,
      dataSource,
    });
    cs.on("update", () => forceRender({}));
    return cs;
  }, [dataSource, itemColorFunction]);

  useMemo(() => {
    if (categoryColumnName !== chartSeries.categoryColumn) {
      chartSeries.categoryColumn = categoryColumnName;
    }
    if (itemsChanged(seriesColumnNames, chartSeries.seriesColumnNames)) {
      chartSeries.seriesColumnNames = seriesColumnNames;
    }
  }, [categoryColumnName, chartSeries, seriesColumnNames]);

  return {
    animation: false,
    color: palette,
    dataZoom: [
      {
        backgroundColor: "var(--vuuChart-zoom-background, transparent)",
        borderColor: "var(--vuuChart-zoom-borderColor, white)",
        handleStyle: {
          color: "var(--vuuChart-zoom-handleColor, white)",
        },
        moveHandleStyle: {
          color: "var(--vuuChart-zoom-slideColor, white)",
        },
        type: "slider",
        start: 0,
        end: 100,
      },
    ],
    grid: {
      left: "0",
      bottom: 0,
      right: 5,
    },
    series: chartSeries.series,
    tooltip: showTooltip
      ? {
          backgroundColor: "",
          borderColor: "",
          // borderWidth: "",
          className: "vuuChartTooltip",
          // padding: "",
          trigger: "axis",
        }
      : undefined,
    xAxis: {
      data: chartSeries.categories,
    },
    yAxis: {
      splitLine: {
        lineStyle: {
          color: "var(--salt-separable-tertiary-borderColor)",
        },
      },
    },
  } as EChartsCoreOption;
};
