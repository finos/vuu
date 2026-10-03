import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { mulberry32 } from "./prng";

export interface InstrumentRow {
  id: string;
  ric: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  bid: number;
  ask: number;
  last: number;
  bidSize: number;
  askSize: number;
  open: number;
  volume: number;
  changePercent: number;
}

const EXCHANGES = ["NYSE", "NASDAQ", "LSE", "XETRA", "TSE", "HKEX"];
const CURRENCIES: Record<string, string> = {
  NYSE: "USD",
  NASDAQ: "USD",
  LSE: "GBP",
  XETRA: "EUR",
  TSE: "JPY",
  HKEX: "HKD",
};
const SECTORS = [
  "Technology",
  "Financials",
  "Energy",
  "Healthcare",
  "Industrials",
  "Consumer",
  "Materials",
  "Utilities",
];

export function generateInstruments(count: number, seed = 42): InstrumentRow[] {
  const rnd = mulberry32(seed);
  const rows: InstrumentRow[] = [];
  for (let i = 0; i < count; i++) {
    const exchange = EXCHANGES[i % EXCHANGES.length];
    const mid = 10 + rnd() * 990;
    const spread = 0.02 + rnd() * 0.3;
    const bid = Math.round((mid - spread / 2) * 100) / 100;
    const ask = Math.round((mid + spread / 2) * 100) / 100;
    const open = Math.round(mid * (0.97 + rnd() * 0.06) * 100) / 100;
    const last = Math.round(((bid + ask) / 2) * 100) / 100;
    rows.push({
      id: `INST-${i}`,
      ric: `SYM${i}.${exchange}`,
      symbol: `SYM${i}`,
      name: `${SECTORS[i % SECTORS.length]} Corp ${i}`,
      exchange,
      currency: CURRENCIES[exchange],
      bid,
      ask,
      last,
      bidSize: Math.round(rnd() * 5000),
      askSize: Math.round(rnd() * 5000),
      open,
      volume: Math.round(rnd() * 5_000_000),
      changePercent: Math.round(((last - open) / open) * 10000) / 100,
    });
  }
  return rows;
}

export const INSTRUMENT_COLUMNS: ColumnDescriptor[] = [
  { name: "ric", width: 130 },
  { name: "symbol", width: 90 },
  { name: "name", width: 220 },
  { name: "exchange", width: 90 },
  { name: "currency", width: 80 },
  {
    name: "bid",
    width: 100,
    type: {
      name: "number",
      renderer: { name: "vuu.price-move-background", flashStyle: "arrow-bg" },
      formatting: { decimals: 2, zeroPad: true },
    },
  },
  {
    name: "ask",
    width: 100,
    type: {
      name: "number",
      renderer: { name: "vuu.price-move-background", flashStyle: "arrow-bg" },
      formatting: { decimals: 2, zeroPad: true },
    },
  },
  {
    name: "last",
    width: 100,
    type: { name: "number", formatting: { decimals: 2, zeroPad: true } },
  },
  {
    name: "bidSize",
    width: 100,
    type: { name: "number", formatting: { decimals: 0 } },
  },
  {
    name: "askSize",
    width: 100,
    type: { name: "number", formatting: { decimals: 0 } },
  },
  { name: "open", width: 100, type: { name: "number", formatting: { decimals: 2 } } },
  {
    name: "volume",
    width: 120,
    type: { name: "number", formatting: { decimals: 0 } },
  },
  {
    name: "changePercent",
    width: 110,
    type: { name: "number", formatting: { decimals: 2 } },
  },
];

export function mutateTick(rnd: () => number, row: InstrumentRow): void {
  const spread = row.ask - row.bid;
  const drift = (rnd() - 0.5) * 0.06;
  const move = spread * 0.15 * (rnd() - 0.5) * 2 + drift;
  const newBid = Math.max(0.01, Math.round((row.bid + move) * 100) / 100);
  const newAsk = Math.max(
    newBid + 0.01,
    Math.round((row.ask + move) * 100) / 100,
  );
  row.bid = newBid;
  row.ask = newAsk;
  row.last = Math.round(((newBid + newAsk) / 2) * 100) / 100;
  row.bidSize = Math.max(0, Math.round(row.bidSize + (rnd() - 0.5) * 200));
  row.askSize = Math.max(0, Math.round(row.askSize + (rnd() - 0.5) * 200));
  row.changePercent =
    Math.round(((row.last - row.open) / row.open) * 10000) / 100;
}
