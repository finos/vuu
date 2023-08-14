import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { FilterClause } from "@finos/vuu-filter-types";
import { VuuTable } from "@finos/vuu-protocol-types";

export interface FilterClauseValueEditor {
  filterClause: Partial<FilterClause>;
  column: ColumnDescriptor;
  table?: VuuTable;
}
