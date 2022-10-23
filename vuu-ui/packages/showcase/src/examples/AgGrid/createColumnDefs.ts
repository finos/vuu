import { AgGridServersideRowModelDataSource } from "@vuu-ui/ag-grid";
import { SetFilterValuesFuncParams } from "ag-grid-community";
import { AgGridViewportDataSource } from "./AgGridDataSource";

export const createColumnDefs = (
  dataSource: AgGridViewportDataSource,
  {
    groupBy,
  }: {
    groupBy?: string[];
  } = {}
) => [
  {
    field: "bbg",
    sortable: true,
    width: 100,
    filter: "agTextColumnFilter",
  },
  {
    field: "currency",
    sortable: true,
    width: 120,
    filter: "agSetColumnFilter",
    filterParams: {
      values: (params: SetFilterValuesFuncParams) => {
        dataSource
          .getSetFilterData(params)
          .then((suggestions) => params.success(suggestions));
      },
    },
  },
  {
    field: "description",
    sortable: true,
    filter: "agTextColumnFilter",
  },
  {
    field: "exchange",
    sortable: true,
    filter: "agSetColumnFilter",
    filterParams: {
      values: (params: SetFilterValuesFuncParams) => {
        dataSource
          .getSetFilterData(params)
          .then((suggestions) => params.success(suggestions));
      },
    },
    rowGroup: groupBy?.includes("exchange"),
  },
  { field: "isin", sortable: true, filter: true, width: 120 },
  {
    field: "lotSize",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 120,
  },
  { field: "ric", sortable: true, filter: true, width: 100 },
];
