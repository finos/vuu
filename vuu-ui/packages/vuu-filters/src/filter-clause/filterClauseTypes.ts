import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { InputProps } from "@salt-ds/core";
import { TableSchemaTable } from "@finos/vuu-data-types";
import { FilterClauseValueChangeHandler } from "./useFilterClause";

export interface FilterClauseValueEditor {
  InputProps?: InputProps;
  column: ColumnDescriptor;
  onDeselect?: () => void;
  onChangeValue: FilterClauseValueChangeHandler;
  onOpenChange?: (open: boolean, closeReason: CloseReason) => void;
  table?: TableSchemaTable;
}
