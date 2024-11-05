import { getDataItemEditControl } from "@finos/vuu-data-react";
import { VirtualColSpan } from "@finos/vuu-table";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import cx from "clsx";

import inlineFilteCss from "./InlineFilter.css";
import { InputProps } from "@salt-ds/core";
import { TableSchemaTable } from "@finos/vuu-data-types";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { BaseRowProps } from "@finos/vuu-table-types";
import { useInlineFilter } from "./useInlineFilter";

const classBase = "vuuInlineFilter";

export type FilterValueChangeHandler = (filter: VuuFilter) => void;
export interface InlineFilterProps
  extends Partial<BaseRowProps>,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: FilterValueChangeHandler;
  table: TableSchemaTable;
}

const InputProps: Partial<InputProps> = {
  inputProps: {
    placeholder: "Filter value",
  },
  variant: "primary",
};

const TypeaheadProps = {
  highlightFirstSuggestion: false,
};

export const InlineFilter = ({
  ariaRole,
  onChange,
  table,
  ...htmlAttributes
}: InlineFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-filter",
    css: inlineFilteCss,
    window: targetWindow,
  });

  const { columns, onCommit, onKeyDown, virtualColSpan } = useInlineFilter({
    onChange,
  });

  return (
    <div {...htmlAttributes} className={classBase} role={ariaRole}>
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column, i) => (
        <div
          aria-colindex={i + 1}
          className={cx(`${classBase}Cell`, "vuuTableCell", {
            "vuuTableCell-right": column.align === "right",
          })}
          data-field={column.name}
          onKeyDown={onKeyDown}
          key={column.name}
          role="cell"
          style={{ width: column.width }}
        >
          {getDataItemEditControl({
            InputProps,
            TypeaheadProps,
            commitWhenCleared: true,
            dataDescriptor: column,
            onCommit,
            table,
          })}
        </div>
      ))}
    </div>
  );
};
