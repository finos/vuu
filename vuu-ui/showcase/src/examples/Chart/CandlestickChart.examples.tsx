import {
  CandlestickChart,
  type CandlestickOverlayDef,
  type ChartItemEvent,
} from "@vuu-ui/vuu-chart";
import { useCallback, useState } from "react";
import { useBarsDataSource, useSimulatedBars } from "./trading-data";

const chartStyle = { height: 560, width: 900 };

const sideColors = { BUY: "up", SELL: "down" };

/**
 * Bars (5 second interval, latest bar ticking) with volume pane, vwap line
 * overlay from the same DataSource, fills overlay (second DataSource) and
 * mark lines for last price and average fill price.
 */
export const OhlcWithVolumeAndFills = () => {
  const { barsDataSource, fillsDataSource } = useSimulatedBars();
  const [selected, setSelected] = useState<string>("");
  const overlays: CandlestickOverlayDef[] = [
    { type: "line", columnName: "vwap", name: "VWAP", color: "palette-3" },
    {
      type: "scatter",
      columnName: "price",
      dataSource: fillsDataSource,
      timeColumnName: "time",
      name: "Fills",
      colorBy: { columnName: "side", colors: sideColors },
      symbol: "diamond",
      symbolSize: 12,
      markLines: [
        { value: { weightedAverage: "quantity" }, label: "Avg fill", color: "palette-2" },
      ],
    },
  ];
  const onItemClick = useCallback((evt: ChartItemEvent) => {
    const { columnMap, row, seriesName } = evt;
    if (row) {
      setSelected(
        `${seriesName}: ${Object.entries(columnMap)
          .map(([name, i]) => `${name}=${row[i]}`)
          .join(", ")}`,
      );
    }
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <CandlestickChart
        dataSource={barsDataSource}
        markLines={[{ value: "last", label: "Last" }]}
        onItemClick={onItemClick}
        overlays={overlays}
        style={chartStyle}
        volumeColumnName="volume"
      />
      <div data-testid="selected-item" style={{ fontSize: 12 }}>
        {selected}
      </div>
    </div>
  );
};

/**
 * Continuous time axis, rather than category axis.
 */
export const OhlcTimeAxis = () => {
  const { barsDataSource } = useSimulatedBars({ barCount: 60 });
  return (
    <CandlestickChart
      dataSource={barsDataSource}
      dataZoom="inside"
      style={chartStyle}
      xAxisType="time"
    />
  );
};

/**
 * Two charts over the same bars table, each chart has its own DataSource.
 * The second chart uses the echartsOptions escape hatch to add a title and
 * change the candle colours.
 */
export const OhlcWithEChartsOptions = () => {
  const { barsDataSource, simulation } = useSimulatedBars({ barCount: 80 });
  const secondDataSource = useBarsDataSource(simulation);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <CandlestickChart
        dataSource={barsDataSource}
        dataZoom={false}
        style={{ height: 400, width: 500 }}
      />
      <CandlestickChart
        dataSource={secondDataSource}
        dataZoom={false}
        echartsOptions={{
          title: { text: "VOD.L 5s", left: 8, top: 0 },
          grid: [{ id: "price", top: 40 }],
          series: [
            {
              id: "candles",
              itemStyle: {
                color: "#26a69a",
                color0: "#ef5350",
                borderColor: "#26a69a",
                borderColor0: "#ef5350",
              },
            },
          ],
        }}
        style={{ height: 400, width: 500 }}
      />
    </div>
  );
};
