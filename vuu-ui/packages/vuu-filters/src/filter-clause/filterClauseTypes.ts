import { FilterClause } from "@finos/vuu-filter-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { InputProps } from "@salt-ds/core";

export interface FilterClauseValueEditor<T = string> {
  InputProps?: InputProps;
  filterClause: Partial<FilterClause>;
  column: ColumnDescriptor;
  onDeselect?: () => void;
  onInputComplete: (value: T | T[]) => void;
  onOpenChange?: (open: boolean, closeReason: CloseReason) => void;
  table?: VuuTable;
}
