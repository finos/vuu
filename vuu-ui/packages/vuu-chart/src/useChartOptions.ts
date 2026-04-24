import { type EChartsCoreOption } from "echarts";
import { useMemo, useState } from "react";
import { ChartSeries } from "./ChartSeries";
import { DataSource } from "@vuu-ui/vuu-data-types";

export interface ChartOptionsProps {
  categoryColumnName: string;
  dataSource: DataSource;
  seriesColumnNames: string[];
}

export const useChartOptions = ({
  categoryColumnName,
  dataSource,
  seriesColumnNames,
}: ChartOptionsProps) => {
  const [, forceRender] = useState({});

  const chartSeries = useMemo(() => {
    const cs = new ChartSeries({
      category: categoryColumnName,
      series: seriesColumnNames,
      dataSource,
    });
    cs.on("update", () => forceRender({}));
    return cs;
  }, [categoryColumnName, dataSource, seriesColumnNames]);

  return {
    animation: false,
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
