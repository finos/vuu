import { getDataItemEditControl } from "@finos/vuu-data-react";
import { DataSource } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, MutableRefObject } from "react";
import { VirtualColSpan } from "../VirtualColSpan";
import { useHeaderProps } from "../table-header";
import { useBulkEditRow } from "./useBulkEditRow";

import bulkEditRowCss from "./BulkEditRow.css";

const classBase = "vuuBulkEditRow";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: string,
) => void;
export interface BulkEditProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  dataSource: DataSource;
  onBulkChange: EditValueChangeHandler;
  bulkRowValidRef: MutableRefObject<boolean>;
}

export const BulkEditRow = ({
  dataSource,
  onBulkChange,
  bulkRowValidRef,
  ...htmlAttributes
}: BulkEditProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditRowCss,
    window: targetWindow,
  });

  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const { errorMessages, formFieldsContainerRef, onChange, onCommit, onFocus } =
    useBulkEditRow({
      descriptors: columns,
      onBulkChange,
      bulkRowValidRef,
    });

  return (
    <div
      {...htmlAttributes}
      className={classBase}
      onFocus={onFocus}
      ref={formFieldsContainerRef}
    >
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column, i) => {
        const errorMessage = errorMessages[column.name];
        return (
          <div
            aria-colindex={i + 1}
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
