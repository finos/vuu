import { type EChartsCoreOption } from "echarts";
import { useMemo, useState } from "react";
import { ChartSeries, ItemColorFunction } from "./ChartSeries";
import { DataSource } from "@vuu-ui/vuu-data-types";

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
}

export const useChartOptions = ({
  categoryColumnName,
  dataSource,
  itemColorFunction,
  palette = defaultPalette,
  seriesColumnNames,
}: ChartOptionsProps) => {
  const [, forceRender] = useState({});

  const chartSeries = useMemo(() => {
    const cs = new ChartSeries({
      category: categoryColumnName,
      itemColorFunction,
      series: seriesColumnNames,
      dataSource,
    });
    cs.on("update", () => forceRender({}));
    return cs;
  }, [categoryColumnName, dataSource, itemColorFunction, seriesColumnNames]);

  return {
    animation: false,
    color: palette,
    dataZoom: [
      {
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
    xAxis: {
      data: chartSeries.categories,
    },
    yAxis: {},
  } as EChartsCoreOption;
};
