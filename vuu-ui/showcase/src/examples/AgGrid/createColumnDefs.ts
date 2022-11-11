import { ColDef, SetFilterValuesFuncParams } from "ag-grid-community";
import { FilterDataProvider } from "@vuu-ui/vuu-data-ag-grid";

export type ColumnOverrides = { [key: string]: Partial<ColDef> };

export const createColumnDefs = (
  setFilterDataProvider: FilterDataProvider,
  table = "instruments",
  columnOverrides?: ColumnOverrides
) => {
  switch (table) {
    case "instruments":
      return [
        {
          field: "bbg",
          sortable: true,
          width: 100,
          filter: "agTextColumnFilter",
          ...columnOverrides?.bbg,
        },
        {
          field: "currency",
          // hide: true,
          enableRowGroup: true,
          sortable: true,
          width: 120,
          filter: "agSetColumnFilter",
          filterParams: {
            values: (params: SetFilterValuesFuncParams) => {
              setFilterDataProvider
                .getSetFilterData(params)
                .then(params.success);
            },
          },
          ...columnOverrides?.currency,
        },
        {
          field: "description",
          sortable: true,
          filter: "agTextColumnFilter",
          ...columnOverrides?.description,
        },
        {
          enableRowGroup: true,
          field: "exchange",
          sortable: true,
          filter: "agSetColumnFilter",
          filterParams: {
            values: (params: SetFilterValuesFuncParams) => {
              setFilterDataProvider
                .getSetFilterData(params)
                .then(params.success);
            },
          },
          ...columnOverrides?.exchange,
        },
        {
          field: "isin",
          sortable: true,
          filter: true,
          width: 120,
          ...columnOverrides?.isin,
        },
        {
          field: "lotSize",
          sortable: true,
          filter: "agNumberColumnFilter",
          width: 120,
          ...columnOverrides?.lotSize,
        },
        {
          field: "ric",
          sortable: true,
          filter: true,
          width: 100,
          ...columnOverrides?.ric,
        },
      ];
    case "prices":
      return [
        { field: "ask" },
        { field: "askSize" },
        { field: "bid" },
        { field: "bidSize" },
        { field: "close" },
        { field: "last" },
        { field: "open" },
        { field: "phase" },
        { field: "ric" },
        { field: "scenario" },
      ];
    default:
      console.log(`do not currently support table ${table}`);
  }
};
