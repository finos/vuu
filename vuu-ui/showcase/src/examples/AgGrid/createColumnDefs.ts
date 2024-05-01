import {
  BackgroundCellRenderer,
  FilterDataProvider,
} from "@finos/vuu-data-ag-grid";
import { ColumnDescriptor } from "@finos/vuu-table-types";

type AgGridCellRenderer = typeof BackgroundCellRenderer;

const groupableColumns = new Set(["ccy", "currency", "exchange", "ric"]);
const cellRenderers: { [key: string]: AgGridCellRenderer } = {
  ask: BackgroundCellRenderer,
  bid: BackgroundCellRenderer,
};

const vuuSetFilters = new Set(["ccy", "currency"]);

const getFilterAttributes = (
  column: ColumnDescriptor,
  setFilterDataProvider: FilterDataProvider
) => {
  switch (column.serverDataType) {
    case "double":
    case "int":
      return {
        filter: "agNumberColumnFilter",
      };
      break;
    case "string":
      if (vuuSetFilters.has(column.name)) {
        return {
          filter: "agSetColumnFilter",
          filterParams: {
            values: (params: any) => {
              setFilterDataProvider
                .getSetFilterData(params)
                .then(params.success);
            },
          },
        };
      } else {
        return {
          filter: "agTextColumnFilter",
          filterParams: {
            caseSensitive: true,
            filterOptions: ["equals", "notEqual", "startsWith", "endsWith"],
          },
        };
      }
      break;
  }
};

export const createColumnDefs = (
  setFilterDataProvider: FilterDataProvider,
  columns: ColumnDescriptor[]
) =>
  columns.map((column) => ({
    cellRenderer: cellRenderers[column.name],
    enableRowGroup: groupableColumns.has(column.name),
    field: column.name,
    ...getFilterAttributes(column, setFilterDataProvider),
    sortable: true,
    width: 100,
  }));
