import type { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type { InputProps } from "@salt-ds/core";
import type { FilterClauseValueChangeHandler } from "./useFilterClause";
import { OpenChangeReason } from "@salt-ds/core/dist-types/list-control/ListControlContext";

export interface FilterClauseValueEditor {
  inputProps?: InputProps["inputProps"];
  column: ColumnDescriptor;
  onDeselect?: () => void;
  onChangeValue: FilterClauseValueChangeHandler;
  onOpenChange?: (open: boolean, closeReason?: OpenChangeReason) => void;
  table?: TableSchemaTable;
}
