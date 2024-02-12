import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { InputProps } from "@salt-ds/core";
import { TableSchemaTable } from "@finos/vuu-data-types";

export interface FilterClauseValueEditor<T = string> {
  InputProps?: InputProps;
  column: ColumnDescriptor;
  onDeselect?: () => void;
  onInputComplete: (value: T | T[]) => void;
  onOpenChange?: (open: boolean, closeReason: CloseReason) => void;
  table?: TableSchemaTable;
}
