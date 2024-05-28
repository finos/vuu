import { getDataItemEditControl } from "@finos/vuu-data-react";
import { VirtualColSpan, useHeaderProps } from "@finos/vuu-table";
import { Commithandler } from "@finos/vuu-ui-controls";
import { queryClosest } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback } from "react";

import inlineFilteCss from "./InlineFilter.css";
import { ColumnDescriptor } from "packages/vuu-table-types";

const classBase = "vuuInlineFilter";

export type FilterValueChangeHandler = (
  column: ColumnDescriptor,
  value: string
) => void;
export interface InlineFilterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: FilterValueChangeHandler;
}

export const InlineFilter = ({
  onChange,
  ...htmlAttributes
}: InlineFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-filter",
    css: inlineFilteCss,
    window: targetWindow,
  });

  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<Commithandler>(
    (evt, value) => {
      const field = queryClosest(evt.target, "[data-field]");
      if (field) {
        const columnName = field.dataset.field;
        const column = columns.find((c) => c.name === columnName);
        if (column) {
          onChange(column, value);
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
