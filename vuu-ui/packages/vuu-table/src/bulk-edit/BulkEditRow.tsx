import { getDataItemEditControl } from "@finos/vuu-data-react";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { Commithandler } from "@finos/vuu-ui-controls";
import { queryClosest } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback } from "react";
import { VirtualColSpan } from "../VirtualColSpan";
import { useHeaderProps } from "../table-header";

import bulkEditRowCss from "./BulkEditRow.css";

const classBase = "vuuBulkEditRow";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: string
) => void;
export interface BulkEditProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: EditValueChangeHandler;
}

export const BulkEditRow = ({ onChange, ...htmlAttributes }: BulkEditProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-bulk-edit-row",
    css: bulkEditRowCss,
    window: targetWindow,
  });

  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<Commithandler>(
    (evt, value) => {
      if (String(value).trim() !== "") {
        const field = queryClosest(evt.target, "[data-field]");
        if (field) {
          const columnName = field.dataset.field;
          const column = columns.find((c) => c.name === columnName);
          if (column) {
            onChange(column, value);
          }
        }
      }
    },
    [columns, onChange]
  );

  return (
    <div {...htmlAttributes} className={classBase}>
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column) => (
        <div
          className={`${classBase}-filter`}
          key={column.name}
          style={{ width: column.width }}
        >
          {getDataItemEditControl({ column, onCommit })}
        </div>
      ))}
    </div>
  );
};
