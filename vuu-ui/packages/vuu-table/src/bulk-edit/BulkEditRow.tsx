import { getDataItemEditControl } from "@finos/vuu-data-react";
import { DataSource } from "@finos/vuu-data-types";
import { BaseRowProps, ColumnDescriptor } from "@finos/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import { VirtualColSpan } from "../VirtualColSpan";
import { useHeaderProps } from "../table-header";
import { useBulkEditRow } from "./useBulkEditRow";

import bulkEditRowCss from "./BulkEditRow.css";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";

const classBase = "vuuBulkEditRow";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: VuuRowDataItemType,
) => void;
export interface BulkEditProps
  extends Partial<BaseRowProps>,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  dataSource: DataSource;
  onBulkChange: EditValueChangeHandler;
  onRowChange: (isValid: boolean) => void;
}

export const BulkEditRow = ({
  ariaRole,
  dataSource,
  onBulkChange,
  onRowChange,
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
      onRowChange,
    });

  return (
    <div
      {...htmlAttributes}
      className={classBase}
      onFocus={onFocus}
      ref={formFieldsContainerRef}
      role={ariaRole}
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
