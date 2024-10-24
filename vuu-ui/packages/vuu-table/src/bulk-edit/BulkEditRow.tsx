import { getDataItemEditControl } from "@finos/vuu-data-react";
import { DataSource } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CommitHandler, queryClosest } from "@finos/vuu-utils";
import type { InputProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback, useRef } from "react";
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
  onChange: EditValueChangeHandler;
}

const InputProps: Partial<InputProps> = {
  placeholder: "Enter value",
  variant: "primary",
};

export const BulkEditRow = ({
  dataSource,
  onChange,
  ...htmlAttributes
}: BulkEditProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditRowCss,
    window: targetWindow,
  });

  const fieldRef = useRef("");

  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<CommitHandler<HTMLElement, string | undefined>>(
    (evt, value) => {
      if (value !== undefined && String(value).trim() !== "") {
        const columnName = fieldRef.current;
        if (columnName) {
          const column = columns.find((c) => c.name === columnName);
          if (column) {
            onChange(column, value);
          }
        }
      }
    },
    [columns, onChange],
  );

  const handleFocus = useCallback((evt) => {
    const field = queryClosest(evt.target, "[data-field]");
    if (field) {
      const columnName = field.dataset.field;
      if (columnName) {
        fieldRef.current = columnName;
      }
    }
  }, []);

  return (
    <div {...htmlAttributes} className={classBase} onFocus={handleFocus}>
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column) => (
        <div
          className={`${classBase}-filter`}
          data-field={column.name}
          key={column.name}
          style={{ width: column.width }}
        >
          {getDataItemEditControl({
            InputProps,
            dataDescriptor: column,
            onCommit,
            table: dataSource.table,
          })}
        </div>
      ))}
    </div>
  );
};
