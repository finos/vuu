import { type InputProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { VuuFilter } from "@vuu-ui/vuu-protocol-types";
import { VirtualColSpan } from "@vuu-ui/vuu-table";
import { BaseRowProps } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { HTMLAttributes } from "react";
import {
  FilterContainerColumnFilter as ColumnFilter,
  FilterContainer,
} from "../filter-container/FilterContainer";
import { useInlineFilter } from "./useInlineFilter";

import { ColumnFilterProps } from "../column-filter/ColumnFilter";
import { FilterAppliedHandler } from "../filter-container/useFilterContainer";
import inlineFilteCss from "./InlineFilter.css";

const classBase = "vuuInlineFilter";

export type FilterValueChangeHandler = (filter: VuuFilter) => void;
export interface InlineFilterProps
  extends Partial<BaseRowProps>,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onFilterApplied?: FilterAppliedHandler;
  onFilterCleared?: () => void;
  table: TableSchemaTable;
}

const InputProps: Partial<InputProps> = {
  inputProps: {
    placeholder: "Filter value",
  },
  variant: "primary",
};

const TypeaheadProps: ColumnFilterProps["TypeaheadProps"] = {
  highlightFirstSuggestion: false,
  minCharacterCountToTriggerSuggestions: 0,
};

export const InlineFilter = ({
  ariaRole,
  onFilterApplied,
  onFilterCleared,
  table,
  ...htmlAttributes
}: InlineFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-filter",
    css: inlineFilteCss,
    window: targetWindow,
  });

  const { columns, onKeyDown, virtualColSpan } = useInlineFilter();

  return (
    <FilterContainer
      {...htmlAttributes}
      className={classBase}
      onFilterApplied={onFilterApplied}
      onFilterCleared={onFilterCleared}
      role={ariaRole}
    >
      <VirtualColSpan width={virtualColSpan} />
      {columns.map((column, i) => (
        <ColumnFilter
          InputProps={InputProps}
          TypeaheadProps={TypeaheadProps}
          aria-colindex={i + 1}
          className={cx(`${classBase}Cell`, "vuuTableCell", {
            "vuuTableCell-right": column.align === "right",
          })}
          column={column}
          onKeyDown={onKeyDown}
          key={column.name}
          role="cell"
          style={{ width: column.width }}
          table={table}
        />
      ))}
    </FilterContainer>
  );
};
