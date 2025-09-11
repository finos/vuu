import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { BaseRowProps, ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { VirtualColSpan } from "../VirtualColSpan";
import { useHeaderProps } from "../table-header";
import { useBulkEditRow } from "./useBulkEditRow";

import bulkEditRowCss from "./BulkEditRow.css";
import { isNotHidden } from "@vuu-ui/vuu-utils";

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

  const {
    errorMessages,
    formFieldsContainerRef,
    InputProps,
    onCommit,
    onFocus,
    onKeyDown,
  } = useBulkEditRow({
    descriptors: columns,
    onBulkChange,
    onRowChange,
  });

  return (
    <div
      {...htmlAttributes}
      className={classBase}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      ref={formFieldsContainerRef}
      role={ariaRole}
    >
      <VirtualColSpan width={virtualColSpan} />
      {columns.filter(isNotHidden).map((column, i) => {
        const errorMessage = errorMessages[column.name];
        return (
          <div
            aria-colindex={i + 1}
            className={cx(`${classBase}Cell`, "vuuTableCell", {
              "vuuTableCell-right": column.align === "right",
            })}
            data-field={column.name}
            key={column.name}
            role="cell"
            style={{ width: column.width }}
          >
            {column.editable
              ? getDataItemEditControl({
                  InputProps,
                  dataDescriptor: column,
                  errorMessage,
                  onCommit,
                  table: dataSource.table,
                })
              : null}
          </div>
        );
      })}
    </div>
  );
};
