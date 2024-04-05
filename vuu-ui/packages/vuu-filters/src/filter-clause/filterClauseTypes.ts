import type { ColumnDescriptor } from "@finos/vuu-table-types";
import type { CloseReason } from "@finos/vuu-ui-controls";
import type { TableSchemaTable } from "@finos/vuu-data-types";
import type { FilterClauseValueChangeHandler } from "./useFilterClause";
import type { InputHTMLAttributes } from "react";

export interface FilterClauseValueEditor {
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  column: ColumnDescriptor;
  onDeselect?: () => void;
  onChangeValue: FilterClauseValueChangeHandler;
  onOpenChange?: (open: boolean, closeReason: CloseReason) => void;
  table?: TableSchemaTable;
}
