import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";

export const INSTRUMENTS = { module: "SIMUL", table: "instruments" } as const;

export const instrumentColumns: ColumnDescriptor[] = [
  { name: "ric", serverDataType: "string", width: 90 },
  { name: "description", serverDataType: "string", width: 180 },
  { name: "currency", serverDataType: "string", width: 80 },
  { name: "exchange", serverDataType: "string", width: 100 },
  { name: "lotSize", serverDataType: "int", width: 80 },
  { name: "isin", serverDataType: "string", width: 120 },
  { name: "bbg", serverDataType: "string", width: 100 },
  { name: "vuuMsg", serverDataType: "string", width: 140 },
];

export const instrumentColumnNames = instrumentColumns.map(({ name }) => name);

export const instrumentsTableConfig: TableConfig = {
  columns: instrumentColumns,
  rowSeparators: true,
  zebraStripes: true,
};

export const CURRENCIES = ["EUR", "GBP", "USD", "JPY", "CHF"];
