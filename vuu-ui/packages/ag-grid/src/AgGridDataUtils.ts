import { DataSourceRow } from "@vuu-ui/data-remote";

export type AgGridDataRow = Record<string, number | string | boolean>;
export type AgGridDataSet = { [key: number]: AgGridDataRow };

export const convertToAgGridDataSet = (
  rows: DataSourceRow[]
): AgGridDataSet => {
  const result: AgGridDataSet = {};
  rows.forEach((row) => {
    const [rowIdx] = row;
    result[rowIdx] = toAgGridRow(row);
  });
  return result;
};

export const convertToAgGridDataRows = (
  rows: DataSourceRow[]
): AgGridDataRow[] => {
  const result: AgGridDataRow[] = [];
  rows.forEach((row) => {
    result.push(toAgGridRow(row));
  });
  return result;
};

// TODO compute the col names
export const toAgGridRow = (data: DataSourceRow) => {
  return {
    bbg: data[8],
    currency: data[9],
    description: data[10],
    exchange: data[11],
    isin: data[12],
    lotSize: data[13],
    ric: data[14],
  };
};
