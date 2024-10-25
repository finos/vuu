import { getDataItemEditControl } from "@finos/vuu-data-react";
import { DataSource } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CommitHandler } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  FocusEventHandler,
  HTMLAttributes,
  Ref,
  SyntheticEvent,
  useCallback,
} from "react";
import { VirtualColSpan } from "../VirtualColSpan";
import { useHeaderProps } from "../table-header";

import bulkEditRowCss from "./BulkEditRow.css";

const classBase = "vuuBulkEditRow";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: string,
) => void;
export interface BulkEditProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  dataSource: DataSource;
  errorMessages: Record<string, string>;
  formFieldsContainerRef: Ref<HTMLDivElement>;
  focusedFieldRef: any;
  handleFocus: FocusEventHandler;
  onBulkChange: EditValueChangeHandler;
  onChange: (evt: SyntheticEvent<HTMLInputElement>) => void;
}

export const BulkEditRow = ({
  dataSource,
  onBulkChange,
  errorMessages,
  formFieldsContainerRef,
  focusedFieldRef,
  handleFocus,
  onChange,
  ...htmlAttributes
}: BulkEditProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditRowCss,
    window: targetWindow,
  });

  const fieldRef = focusedFieldRef;

  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<CommitHandler<HTMLElement, string | undefined>>(
    (evt, value) => {
      if (value !== undefined && String(value).trim() !== "" && fieldRef) {
        const columnName = fieldRef.current;
        if (columnName) {
          const column = columns.find((c) => c.name === columnName);
          if (column && errorMessages[columnName] === undefined) {
            onBulkChange(column, value);
          }
        }
      }
    },
    [fieldRef, columns, errorMessages, onBulkChange],
  );

  return (
    <div
      {...htmlAttributes}
      className={classBase}
      onFocus={handleFocus}
      ref={formFieldsContainerRef}
    >
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column) => {
        const errorMessage = errorMessages[column.name];
        return (
          <div
            className={`${classBase}-filter`}
            data-field={column.name}
            key={column.name}
            style={{ width: column.width }}
          >
            {getDataItemEditControl({
              InputProps: {
                onChange,
                placeholder: "Enter value",
                variant: "primary",
              },
              dataDescriptor: column,
              errorMessage,
              onCommit,
              table: dataSource.table,
            })}
          </div>
        );
      })}
    </div>
  );
};
