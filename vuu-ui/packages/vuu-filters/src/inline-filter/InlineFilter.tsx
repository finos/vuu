import { getDataItemEditControl } from "@finos/vuu-data-react";
import { VirtualColSpan, useHeaderProps } from "@finos/vuu-table";
import { CommitHandler, getFieldName } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback } from "react";
import { ColumnDescriptor } from "@finos/vuu-table-types";

import inlineFilteCss from "./InlineFilter.css";
import { InputProps } from "@salt-ds/core";

const classBase = "vuuInlineFilter";

export type FilterValueChangeHandler = (
  column: ColumnDescriptor,
  value: string
) => void;
export interface InlineFilterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: FilterValueChangeHandler;
}

const InputProps: Partial<InputProps> = {
  placeholder: "Enter value",
  variant: "primary"
};

export const InlineFilter = ({
  onChange,
  ...htmlAttributes
}: InlineFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-filter",
    css: inlineFilteCss,
    window: targetWindow
  });

  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<
    CommitHandler<HTMLInputElement, string | number | undefined>
  >(
    (evt, value = "") => {
      const fieldName = getFieldName(evt.target);
      const column = columns.find((c) => c.name === fieldName);
      if (column) {
        onChange(column, value.toString());
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
          {getDataItemEditControl({ InputProps, column, onCommit })}
        </div>
      ))}
    </div>
  );
};
