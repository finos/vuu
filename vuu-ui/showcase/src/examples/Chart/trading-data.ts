import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  Table,
  TickingArrayDataSource,
  buildDataColumnMapFromSchema,
} from "@vuu-ui/vuu-data-test";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { useEffect, useMemo } from "react";

/**
 * Simulated trading data for chart examples. Schemas match (a subset of) the
 * tables published by a vuu trading server: bars, depth, trades, fills and
 * positions. Each hook creates its own Table and ticks it until unmount.
 */

const module = "SIMUL";

const schema = (
  table: string,
  key: string,
  columns: TableSchema["columns"],
): TableSchema => ({ columns, key, table: { module, table } });

export const barsSchema = schema("bars", "key", [
  { name: "key", serverDataType: "string" },
  { name: "ric", serverDataType: "string" },
  { name: "interval", serverDataType: "string" },
  { name: "start", serverDataType: "epochtimestamp" },
  { name: "open", serverDataType: "double" },
  { name: "high", serverDataType: "double" },
  { name: "low", serverDataType: "double" },
  { name: "close", serverDataType: "double" },
  { name: "volume", serverDataType: "long" },
  { name: "vwap", serverDataType: "double" },
  { name: "trades", serverDataType: "int" },
]);

export const depthSchema = schema("depth", "key", [
  { name: "key", serverDataType: "string" },
  { name: "ric", serverDataType: "string" },
  { name: "side", serverDataType: "string" },
  { name: "level", serverDataType: "int" },
  { name: "price", serverDataType: "double" },
  { name: "size", serverDataType: "long" },
  { name: "cumSize", serverDataType: "long" },
  { name: "orderCount", serverDataType: "int" },
]);

export const tradesSchema = schema("trades", "tradeId", [
  { name: "tradeId", serverDataType: "string" },
  { name: "ric", serverDataType: "string" },
  { name: "price", serverDataType: "double" },
  { name: "quantity", serverDataType: "long" },
  { name: "aggressorSide", serverDataType: "string" },
  { name: "time", serverDataType: "epochtimestamp" },
]);

export const fillsSchema = schema("fills", "fillId", [
  { name: "fillId", serverDataType: "string" },
  { name: "ric", serverDataType: "string" },
  { name: "side", serverDataType: "string" },
  { name: "price", serverDataType: "double" },
  { name: "quantity", serverDataType: "long" },
  { name: "time", serverDataType: "epochtimestamp" },
]);

export const positionsSchema = schema("positions", "key", [
  { name: "key", serverDataType: "string" },
  { name: "account", serverDataType: "string" },
  { name: "ric", serverDataType: "string" },
  { name: "sector", serverDataType: "string" },
  { name: "currency", serverDataType: "string" },
  { name: "quantity", serverDataType: "long" },
  { name: "notional", serverDataType: "double" },
  { name: "pnl", serverDataType: "double" },
]);

/** deterministic pseudo random numbers, so initial data is stable */
const random = (seed = 42) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const round = (value: number, dp = 2) => +value.toFixed(dp);

const createTable = (tableSchema: TableSchema, rows: VuuRowDataItemType[][]) =>
  new Table(tableSchema, rows, buildDataColumnMapFromSchema(tableSchema));

const createDataSource = (table: Table) =>
  new TickingArrayDataSource({
    columnDescriptors: table.schema.columns.map(({ name, serverDataType }) => ({
      name,
      serverDataType,
    })),
    table,
  });

const useTicker = (tick: () => void, intervalMs: number, enabled = true) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs, tick]);
};

const RIC = "VOD.L";

export interface PriceSimulation {
  barsTable: Table;
  fillsTable: Table;
  tick: () => void;
}

/**
 * OHLC bars plus fills, driven by a random walk. The latest bar is updated in
 * place until it closes, then a new bar is inserted, as the vuu bars table.
 */
const createPriceSimulation = (
  barCount: number,
  barMillis: number,
  ticksPerBar: number,
): PriceSimulation => {
  const rand = random(7);
  const now = Math.floor(Date.now() / barMillis) * barMillis;
  let price = 100;
  let fillId = 0;
  const interval = barMillis >= 60000 ? `${barMillis / 60000}m` : `${barMillis / 1000}s`;
  const barRows: VuuRowDataItemType[][] = [];
  const fillRows: VuuRowDataItemType[][] = [];

  const newBar = (start: number, open: number): VuuRowDataItemType[] => [
    `${RIC}|${interval}|${start}`,
    RIC,
    interval,
    start,
    open,
    open,
    open,
    open,
    0,
    open,
    0,
  ];
  const applyTrade = (bar: VuuRowDataItemType[], tradePrice: number, qty: number) => {
    const volume = (bar[8] as number) + qty;
    bar[5] = Math.max(bar[5] as number, tradePrice);
    bar[6] = Math.min(bar[6] as number, tradePrice);
    bar[7] = tradePrice;
    bar[9] = round(((bar[9] as number) * (bar[8] as number) + tradePrice * qty) / volume, 3);
    bar[8] = volume;
    bar[10] = (bar[10] as number) + 1;
  };
  const nextPrice = () => {
    price = round(Math.max(1, price + (rand() - 0.5) * 0.6 + Math.sin(price) * 0.02));
    return price;
  };
  const addFill = (time: number, fillPrice: number) => {
    fillRows.push([
      `F${++fillId}`,
      RIC,
      rand() > 0.5 ? "BUY" : "SELL",
      fillPrice,
      Math.round(1 + rand() * 9) * 100,
      time,
    ]);
  };

  for (let i = barCount - 1; i >= 0; i--) {
    const start = now - i * barMillis;
    const bar = newBar(start, price);
    for (let t = 0; t < ticksPerBar; t++) {
      applyTrade(bar, nextPrice(), Math.round(100 + rand() * 2000));
    }
    if (rand() > 0.85) {
      addFill(start + barMillis / 2, bar[7] as number);
    }
    barRows.push(bar);
  }

  const barsTable = createTable(barsSchema, barRows);
  const fillsTable = createTable(fillsSchema, fillRows);
  let currentBar = barRows[barRows.length - 1].slice();

  const tick = () => {
    const time = Date.now();
    const start = Math.floor(time / barMillis) * barMillis;
    if (start > (currentBar[3] as number)) {
      currentBar = newBar(start, currentBar[7] as number);
      barsTable.insert(currentBar.slice());
      // keep a rolling window of bars
      const oldest = barsTable.data[0];
      if (barsTable.data.length > barCount && oldest) {
        barsTable.delete(oldest[0] as string);
      }
    }
    applyTrade(currentBar, nextPrice(), Math.round(100 + rand() * 2000));
    barsTable.updateRow(currentBar.slice());
    if (rand() > 0.97) {
      fillsTable.insert([
        `F${++fillId}`,
        RIC,
        rand() > 0.5 ? "BUY" : "SELL",
        currentBar[7] as number,
        Math.round(1 + rand() * 9) * 100,
        time,
      ]);
    }
  };

  return { barsTable, fillsTable, tick };
};

export const useSimulatedBars = ({
  barCount = 120,
  barMillis = 5000,
  ticking = true,
  ticksPerBar = 12,
}: {
  barCount?: number;
  barMillis?: number;
  ticking?: boolean;
  ticksPerBar?: number;
} = {}) => {
  const simulation = useMemo(
    () => createPriceSimulation(barCount, barMillis, ticksPerBar),
    [barCount, barMillis, ticksPerBar],
  );
  const barsDataSource = useMemo(
    () => createDataSource(simulation.barsTable),
    [simulation],
  );
  const fillsDataSource = useMemo(
    () => createDataSource(simulation.fillsTable),
    [simulation],
  );
  useTicker(simulation.tick, barMillis / ticksPerBar, ticking);
  return { barsDataSource, fillsDataSource, simulation };
};

/**
 * A second DataSource on the same bars table, each chart needs its own
 * DataSource instance.
 */
export const useBarsDataSource = (simulation: PriceSimulation) =>
  useMemo(() => createDataSource(simulation.barsTable), [simulation]);

/**
 * Order book of `levels` price levels each side, sizes ticking and mid price
 * drifting.
 */
export const useSimulatedDepth = ({
  levels = 15,
  ticking = true,
}: { levels?: number; ticking?: boolean } = {}) => {
  const { table, tick } = useMemo(() => {
    const rand = random(11);
    let mid = 100;
    const tickSize = 0.05;
    const sizes = {
      BUY: Array.from({ length: levels }, () => Math.round(500 + rand() * 5000)),
      SELL: Array.from({ length: levels }, () => Math.round(500 + rand() * 5000)),
    };
    const buildRows = () => {
      const rows: VuuRowDataItemType[][] = [];
      (["BUY", "SELL"] as const).forEach((side) => {
        let cum = 0;
        sizes[side].forEach((size, level) => {
          cum += size;
          const offset = (level + 1) * tickSize;
          const price = round(side === "BUY" ? mid - offset : mid + offset, 2);
          rows.push([
            `${RIC}|${side}|${level}`,
            RIC,
            side,
            level,
            price,
            size,
            cum,
            Math.round(1 + size / 500),
          ]);
        });
      });
      return rows;
    };
    const table = createTable(depthSchema, buildRows());
    const tick = () => {
      mid = round(mid + (rand() - 0.5) * 0.1, 2);
      (["BUY", "SELL"] as const).forEach((side) => {
        sizes[side] = sizes[side].map((size) =>
          Math.max(100, Math.round(size + (rand() - 0.5) * 800)),
        );
      });
      for (const row of buildRows()) {
        table.updateRow(row);
      }
    };
    return { table, tick };
  }, [levels]);
  const dataSource = useMemo(() => createDataSource(table), [table]);
  useTicker(tick, 500, ticking);
  return dataSource;
};

/**
 * Trades, for heatmap (price level x time) examples.
 */
export const useSimulatedTrades = ({
  initialCount = 600,
  ticking = true,
}: { initialCount?: number; ticking?: boolean } = {}) => {
  const { table, tick } = useMemo(() => {
    const rand = random(23);
    let price = 100;
    let id = 0;
    let time = Date.now() - initialCount * 250;
    const trade = (): VuuRowDataItemType[] => {
      price = round(price + (rand() - 0.5) * 0.12, 2);
      return [
        `T${++id}`,
        RIC,
        price,
        Math.round(100 + rand() * 1900),
        rand() > 0.5 ? "BUY" : "SELL",
        time,
      ];
    };
    const rows: VuuRowDataItemType[][] = [];
    for (let i = 0; i < initialCount; i++) {
      time += 250;
      rows.push(trade());
    }
    const table = createTable(tradesSchema, rows);
    const tick = () => {
      time = Date.now();
      table.insert(trade());
      const oldest = table.data[0];
      if (table.data.length > initialCount && oldest) {
        table.delete(oldest[0] as string);
      }
    };
    return { table, tick };
  }, [initialCount]);
  const dataSource = useMemo(() => createDataSource(table), [table]);
  useTicker(tick, 250, ticking);
  return dataSource;
};

const sectors: Record<string, string[]> = {
  Technology: ["AAPL.OQ", "MSFT.OQ", "NVDA.OQ", "SAP.DE"],
  Financials: ["HSBA.L", "BARC.L", "JPM.N", "BNPP.PA"],
  Energy: ["BP.L", "SHEL.L", "XOM.N"],
  Healthcare: ["AZN.L", "GSK.L", "NOVN.S"],
  Consumer: ["ULVR.L", "MC.PA", "NESN.S"],
};

/**
 * Positions across two accounts, pnl and notional ticking.
 */
export const useSimulatedPositions = ({
  ticking = true,
}: { ticking?: boolean } = {}) => {
  const { table, tick } = useMemo(() => {
    const rand = random(5);
    const rows: VuuRowDataItemType[][] = [];
    for (const account of ["ACC-1", "ACC-2"]) {
      for (const [sector, rics] of Object.entries(sectors)) {
        for (const ric of rics) {
          const quantity = Math.round((rand() - 0.3) * 20) * 1000;
          const price = 20 + rand() * 300;
          rows.push([
            `${account}|${ric}`,
            account,
            ric,
            sector,
            ric.endsWith(".L") ? "GBP" : ric.match(/\.(DE|PA)$/) ? "EUR" : "USD",
            quantity,
            round(quantity * price),
            round((rand() - 0.45) * 50000),
          ]);
        }
      }
    }
    const table = createTable(positionsSchema, rows);
    const tick = () => {
      const row = table.data[Math.floor(rand() * table.data.length)];
      if (row) {
        const updated = row.slice();
        updated[7] = round((updated[7] as number) + (rand() - 0.5) * 2000);
        updated[6] = round((updated[6] as number) * (1 + (rand() - 0.5) * 0.01));
        table.updateRow(updated);
      }
    };
    return { table, tick };
  }, []);
  const dataSource = useMemo(() => createDataSource(table), [table]);
  useTicker(tick, 300, ticking);
  return dataSource;
};
