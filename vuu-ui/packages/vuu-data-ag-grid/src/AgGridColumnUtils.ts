import { ColumnDescriptor } from "@finos/vuu-table-types";
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

// helps prevent a bug where the dataSource is switched on an AgGrid table
// and the new dataSource may have one or more columns with same name as
// previous dataSource. AgGrid seems to 'remember' the columns and they get
// rendered before all other columns, irrespective of the column order
// of the colDefs. Interestingly, tried making the columnNames unique to the
// dataSource, but didn't fix issue.
export const columnsDisordered = (
  colDefs: { colId: string }[],
  colState: AgGridColDef[]
) => {
  const defs = firstColIsGroup(colDefs) ? colDefs.slice(1) : colDefs;
  if (defs.length !== colState.length) {
    return true;
  }
  for (let i = 0; i < defs.length; i++) {
    if (colState[i].field === undefined || colState[i].hide === true) {
      continue;
    } else if (defs[i].colId !== colState[i].field) {
      return true;
    }
  }
  return false;
};
