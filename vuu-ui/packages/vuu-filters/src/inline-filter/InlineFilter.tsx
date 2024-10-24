import { getDataItemEditControl } from "@finos/vuu-data-react";
import { VirtualColSpan, useHeaderProps } from "@finos/vuu-table";
import {
  CommitHandler,
  FilterAggregator,
  getFieldName,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useCallback, useMemo } from "react";

import inlineFilteCss from "./InlineFilter.css";
import { InputProps } from "@salt-ds/core";
import { TableSchemaTable } from "@finos/vuu-data-types";
import { VuuFilter } from "@finos/vuu-protocol-types";

const classBase = "vuuInlineFilter";

export type FilterValueChangeHandler = (filter: VuuFilter) => void;
export interface InlineFilterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
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
  const { columns, virtualColSpan = 0 } = useHeaderProps();

  const onCommit = useCallback<
    CommitHandler<HTMLElement, string | number | undefined>
  >(
    (evt, value = "") => {
      const fieldName = getFieldName(evt.target);
      const column = columns.find((c) => c.name === fieldName);
      if (column) {
        filterAggregator.addFilter(column, value);
        onChange(filterAggregator.filter);
      }
    },
    [columns, filterAggregator, onChange],
  );

  return (
    <div {...htmlAttributes} className={classBase} role="row">
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
            TypeaheadProps,
            dataDescriptor: column,
            onCommit,
            table,
          })}
        </div>
      ))}
    </div>
  );
};
