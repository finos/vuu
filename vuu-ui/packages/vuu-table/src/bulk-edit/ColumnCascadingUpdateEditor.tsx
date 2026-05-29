import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { BaseRowProps, ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { isNotHidden } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { VirtualColSpan } from "../VirtualColSpan";
import { useHeaderProps } from "../table-header";
import { useBulkEditRow } from "./useColumnCascadingEditor";

import bulkEditRowCss from "./ColumnCascadingUpdateEditor.css";

const classBase = "vuuBulkEditRow";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: VuuRowDataItemType,
) => void;
export interface ColumnCascadingUpdateEditorProps
  extends Partial<BaseRowProps>,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onBulkChange: EditValueChangeHandler;
  onRowChange: (isValid: boolean) => void;
}

export const ColumnCascadingUpdateEditor = ({
  ariaRole,
  onBulkChange,
  onRowChange,
  ...htmlAttributes
}: ColumnCascadingUpdateEditorProps) => {
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
                })
              : null}
          </div>
        );
      })}
    </div>
  );
};
