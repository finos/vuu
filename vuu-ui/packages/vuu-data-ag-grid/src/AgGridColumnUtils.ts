import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy } from "@finos/vuu-protocol-types";
import { FilterDataProvider } from "./FilterDataProvider";

export interface AgGridColDef {
  [key: string]: unknown;
  field?: string;
  enableRowGroup?: boolean;
  rowGroup?: boolean;
}

export const createColumnDefs = (
  setFilterDataProvider: FilterDataProvider,
  columns: ColumnDescriptor[],
  groupBy: VuuGroupBy = []
): AgGridColDef[] => {
  return columns.map((column) => ({
    // cellRenderer: cellRenderers[column.name],
    // enableRowGroup: groupableColumns.has(column.name),
    enableRowGroup: true,
    field: column.name,
    hide: column.hidden || groupBy.includes(column.name),
    rowGroup: groupBy.includes(column.name),

    // ...getFilterAttributes(column, setFilterDataProvider),
    sortable: true,
    width: 100,
  }));
};
