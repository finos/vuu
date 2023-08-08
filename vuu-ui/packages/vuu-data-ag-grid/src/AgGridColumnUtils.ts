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

const firstColIsGroup = (colDefs: { colId: string }[]) => {
  return colDefs.length > 1 && colDefs[0].colId.startsWith("ag-Grid-Auto");
};

export const columnsDisordered = (
  colDefs: { colId: string }[],
  colState: AgGridColDef[]
) => {
  const defs = firstColIsGroup(colDefs) ? colDefs.slice(1) : colDefs;
  if (defs.length !== colState.length) {
    return true;
  }
  for (let i = 0; i < defs.length; i++) {
    if (defs[i].colId !== colState[i].field) {
      return true;
    }
  }
  return false;
};
