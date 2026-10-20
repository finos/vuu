import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type { CellType, DatasetConfig } from "../harness/types";

export type Row = VuuRowDataItemType[];

/** mulberry32, small and fast seeded PRNG returning values in [0, 1) */
export const createRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const KEY_COLUMN = "id";
/** carries the update batch sequence number, used to time update-to-paint */
export const SEQ_COLUMN = "seq";
/** index of the first value column, after id, seq and the text columns */
export const FIRST_VALUE_COLUMN = 4;

const TEXT_VALUES = ["AAPL", "MSFT", "AMZN", "GOOG", "META", "NVDA", "TSLA"];
const CCY_VALUES = ["USD", "EUR", "GBP", "JPY", "CHF"];

const valueColumnType = (
  cellType: CellType,
): ColumnDescriptor["type"] | undefined => {
  switch (cellType) {
    case "formatted":
      return { name: "number", formatting: { decimals: 2, zeroPad: true } };
    case "flash":
      return {
        name: "number",
        formatting: { decimals: 2, zeroPad: true },
        renderer: { name: "vuu.price-move-background" },
      };
    default:
      return undefined;
  }
};

/**
 * Columns: id, seq, two text columns, then (cols - 4) double columns.
 * Value columns are the ones that tick.
 */
export const buildColumns = ({
  cols,
  cellType,
}: DatasetConfig): ColumnDescriptor[] => {
  const columns: ColumnDescriptor[] = [
    { name: KEY_COLUMN, serverDataType: "string", width: 100 },
    { name: SEQ_COLUMN, serverDataType: "string", width: 70 },
    { name: "ric", serverDataType: "string", width: 80 },
    { name: "ccy", serverDataType: "string", width: 60 },
  ];
  const type = valueColumnType(cellType);
  for (
    let i = FIRST_VALUE_COLUMN;
    i < Math.max(cols, FIRST_VALUE_COLUMN);
    i++
  ) {
    columns.push({
      name: `value${i - FIRST_VALUE_COLUMN + 1}`,
      serverDataType: "double",
      width: 90,
      ...(type ? { type } : undefined),
    });
  }
  return columns;
};

export const rowKey = (index: number) => `row-${index}`;

export const generateRows = ({ rows, cols, seed }: DatasetConfig): Row[] => {
  const random = createRandom(seed);
  const columnCount = Math.max(cols, FIRST_VALUE_COLUMN);
  const data = new Array<Row>(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array<VuuRowDataItemType>(columnCount);
    row[0] = rowKey(r);
    row[1] = "0";
    row[2] = TEXT_VALUES[Math.floor(random() * TEXT_VALUES.length)];
    row[3] = CCY_VALUES[Math.floor(random() * CCY_VALUES.length)];
    for (let c = FIRST_VALUE_COLUMN; c < columnCount; c++) {
      row[c] = Math.round(random() * 100_000) / 100;
    }
    data[r] = row;
  }
  return data;
};

/**
 * ArrayDataSource with a public entry point for row updates, so the
 * benchmark drives the same update path a ticking local data source uses.
 */
export class BenchDataSource extends ArrayDataSource {
  applyUpdate(row: Row) {
    this.updateRow(row);
  }
}
