import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { FilterClause } from "@finos/vuu-filter-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { InputProps } from "@salt-ds/core";

export interface FilterClauseValueEditor<T = string> {
  InputProps?: InputProps;
  filterClause: Partial<FilterClause>;
  column: ColumnDescriptor;
  onInputComplete: (value: T) => void;
  table?: VuuTable;
}
