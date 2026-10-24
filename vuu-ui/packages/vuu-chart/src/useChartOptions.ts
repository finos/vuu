import { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import { ColumnMap, itemsChanged } from "@vuu-ui/vuu-utils";
import { type EChartsCoreOption } from "echarts/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChartSelectionModel,
  ItemColorFunction,
  SymbolSize,
  SymbolSizeFunction,
  SymbolType,
} from "./chart-types";
import { ChartSeries } from "./ChartSeries";
import { chartTooltip } from "./chartTooltip";

const defaultPalette = [
  "#4676bf",
  "#ab6528",
  "#9f55c2",
  "#2a8285",
  "#697694",
  "#B0549d",
];

export interface ChartConfig {
  itemColorFunction?: ItemColorFunction;
  selectionModel?: ChartSelectionModel;
  symbolSize?: SymbolSize;
}

export interface DataExclusionOptions {
  isExcludedData: (
    row: DataSourceRow,
    columnMap: ColumnMap,
    column: string,
  ) => boolean;
  /**
   * An embedded SVG path. If provided, will be used to render excluded values.
   */
  symbol?: SymbolType;
}

export interface ChartOptionsProps {
  categoryColumnName: string;
  config: ChartConfig;
  dataExclusions?: DataExclusionOptions;
  dataSource: DataSource;
  itemColorFunction?: ItemColorFunction;
  palette?: string[];
  seriesColumnNames: string[];
  showTooltip?: boolean;
  symbolSizeFunction?: SymbolSizeFunction;
}

const combineConfig = (config: ChartConfig, overrides: ChartConfig) => {
  return {
    ...config,
    ...overrides,
  };
};

export const useChartOptions = ({
  categoryColumnName,
  config,
  dataExclusions,
  dataSource,
  itemColorFunction,
  palette = defaultPalette,
  seriesColumnNames,
  showTooltip = true,
  symbolSizeFunction: symbolSize,
}: ChartOptionsProps) => {
  const [, forceRender] = useState({});
  const frameRef = useRef<number | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: series is recreated only when dataSource or config change
  const chartSeries = useMemo(() => {
    const cs = new ChartSeries({
      config: combineConfig(config, { itemColorFunction, symbolSize }),
      dataExclusions,
      dataSource,
      palette,
    });
    // re-render at most once per animation frame
    cs.on("update", () => {
      if (frameRef.current === undefined) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = undefined;
          forceRender({});
        });
      }
    });
    return cs;
  }, [dataSource, config]);

  const chartSeriesRef = useRef(chartSeries);
  chartSeriesRef.current = chartSeries;

  useEffect(() => {
    chartSeries.subscribe();
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
      // If the DataSource is being replaced, leave it subscribed, the
      // caller owns it and may still depend on it.
      chartSeries.detach();
    };
  }, [chartSeries]);

  useEffect(
    () => () => {
      chartSeriesRef.current.dispose();
    },
    [],
  );

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
    color: chartSeries.palette,
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
          alwaysShowContent: true,
          backgroundColor: "",
          borderColor: "",
          // borderWidth: "",
          className: "vuuChartTooltip",
          enterable: true,
          formatter: chartTooltip,
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
