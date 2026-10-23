import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { datasetColumns, KEY_COLUMN, type Row } from "../harness/dataset";
import type { CellType, DatasetConfig } from "../harness/types";

export {
  createRandom,
  FIRST_VALUE_COLUMN,
  generateRows,
  KEY_COLUMN,
  type Row,
  rowKey,
  SEQ_COLUMN,
} from "../harness/dataset";

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

const TEXT_COLUMN_WIDTHS: Record<string, number> = {
  [KEY_COLUMN]: 100,
  seq: 70,
  ric: 80,
  ccy: 60,
};

/** Column descriptors for a dataset, see datasetColumns */
export const buildColumns = (dataset: DatasetConfig): ColumnDescriptor[] => {
  const type = valueColumnType(dataset.cellType);
  return datasetColumns(dataset).map(({ name, serverDataType }) => ({
    name,
    serverDataType,
    width: TEXT_COLUMN_WIDTHS[name] ?? 90,
    ...(serverDataType === "double" && type ? { type } : undefined),
  }));
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
