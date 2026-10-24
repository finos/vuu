import {
  type ChartItemEvent,
  PieChart,
  SunburstChart,
  TreemapChart,
} from "@vuu-ui/vuu-chart";
import { useCallback, useState } from "react";
import { useSimulatedPositions } from "./trading-data";

const chartStyle = { height: 480, width: 800 };

const formatValue = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

/**
 * Exposure (notional) by sector, then ric. Size is absolute notional,
 * colour shows long (up) or short (down). Click a node to drill down.
 */
export const ExposureTreemap = () => {
  const dataSource = useSimulatedPositions();
  const [selected, setSelected] = useState("");
  const onItemClick = useCallback((evt: ChartItemEvent) => {
    setSelected(`${evt.groupPath?.join(" / ")} (${evt.rows?.length} rows)`);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <TreemapChart
        colorMode="sign"
        dataSource={dataSource}
        formatValue={formatValue}
        groupByColumnNames={["sector", "ric"]}
        onItemClick={onItemClick}
        style={chartStyle}
        valueColumnName="notional"
      />
      <div data-testid="selected-item" style={{ fontSize: 12 }}>
        {selected}
      </div>
    </div>
  );
};

/**
 * Pnl by account, sector and ric.
 */
export const PnlSunburst = () => {
  const dataSource = useSimulatedPositions();
  return (
    <SunburstChart
      colorMode="sign"
      dataSource={dataSource}
      formatValue={formatValue}
      groupByColumnNames={["account", "sector", "ric"]}
      style={{ height: 560, width: 560 }}
      valueColumnName="pnl"
    />
  );
};

/**
 * Position count by currency.
 */
export const CurrencyPie = () => {
  const dataSource = useSimulatedPositions();
  return (
    <PieChart
      aggregation="count"
      dataSource={dataSource}
      groupByColumnNames={["currency"]}
      legend="bottom"
      style={{ height: 400, width: 500 }}
      valueColumnName="ric"
    />
  );
};

/**
 * Absolute notional by sector, as a donut.
 */
export const SectorDonut = () => {
  const dataSource = useSimulatedPositions();
  return (
    <PieChart
      dataSource={dataSource}
      donut
      formatValue={formatValue}
      groupByColumnNames={["sector"]}
      style={{ height: 400, width: 500 }}
      valueColumnName="notional"
    />
  );
};
