import type { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type { CloseReason } from "@vuu-ui/vuu-ui-controls";
import type { InputProps } from "@salt-ds/core";
import type { FilterClauseValueChangeHandler } from "./useFilterClause";

export interface FilterClauseValueEditor {
  inputProps?: InputProps["inputProps"];
  column: ColumnDescriptor;
  onDeselect?: () => void;
  onChangeValue: FilterClauseValueChangeHandler;
  onOpenChange?: (open: boolean, closeReason: CloseReason) => void;
  table?: TableSchemaTable;
}
