import { getDataItemEditControl } from "@finos/vuu-data-react";
import { VirtualColSpan, useHeaderProps } from "@finos/vuu-table";
import {
  CommitHandler,
  FilterAggregator,
  getFieldName,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  HTMLAttributes,
  KeyboardEventHandler,
  useCallback,
  useMemo,
} from "react";
import cx from "clsx";

import inlineFilteCss from "./InlineFilter.css";
import { InputProps } from "@salt-ds/core";
import { TableSchemaTable } from "@finos/vuu-data-types";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { BaseRowProps } from "@finos/vuu-table-types";

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

  const filterAggregator = useMemo(() => new FilterAggregator(), []);
  const { columns = [], virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<
    CommitHandler<HTMLElement, string | number | undefined>
  >(
    (evt, value = "") => {
      const fieldName = getFieldName(evt.target);
      const column = columns.find((c) => c.name === fieldName);
      if (column) {
        if (value === "") {
          if (filterAggregator.removeFilter(column)) {
            onChange(filterAggregator.filter);
          }
        } else {
          filterAggregator.addFilter(column, value);
          onChange(filterAggregator.filter);
        }
      }
    },
    [columns, filterAggregator, onChange],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (evt) => {
      if (evt.key === "Enter") {
        const el = evt.target as HTMLElement;
        const inputElement = el.querySelector("input");
        inputElement?.focus();
      }
    },
    [],
  );

  return (
    <div {...htmlAttributes} className={classBase} role={ariaRole}>
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column, i) => (
        <div
          aria-colindex={i + 1}
          className={cx(`${classBase}-filter`, "vuuTableCell")}
          data-field={column.name}
          onKeyDown={handleKeyDown}
          key={column.name}
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
