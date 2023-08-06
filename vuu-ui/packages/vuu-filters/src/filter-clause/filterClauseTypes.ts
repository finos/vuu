import { ColumnDescriptor } from "packages/vuu-datagrid-types";
import { FilterClause } from "packages/vuu-filter-types";
import { VuuTable } from "packages/vuu-protocol-types";

export interface FilterClauseValueEditor {
  filterClause: Partial<FilterClause>;
  column: ColumnDescriptor;
  table?: VuuTable;
}
