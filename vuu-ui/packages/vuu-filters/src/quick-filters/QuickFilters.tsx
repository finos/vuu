import { getDataItemEditControl } from "@finos/vuu-data-react";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { ColumnPicker, Icon, VuuInput } from "@finos/vuu-ui-controls";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { HTMLAttributes } from "react";
import { FilterBarProps } from "../filter-bar";
import { useQuickFilters } from "./useQuickFilters";

import quickFiltersCss from "./QuickFilters.css";

const classBase = "vuuQuickFilters";

export interface QuickFilterProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      FilterBarProps,
      "onApplyFilter" | "suggestionProvider" | "tableSchema"
    > {
  availableColumns: ColumnDescriptor[];
  quickFilterColumns?: string[];
}

export const QuickFilters = ({
  availableColumns,
  onApplyFilter,
  quickFilterColumns,
  suggestionProvider,
  tableSchema,
}: QuickFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-quick-filters",
    css: quickFiltersCss,
    window: targetWindow,
  });

  const searchIcon = <Icon name="search" size={18} />;

  const {
    availableColumnNames,
    onChange,
    onColumnsSelectionChange,
    onCommit,
    rootRef,
    quickFilters,
  } = useQuickFilters({
    availableColumns,
    onApplyFilter,
    quickFilterColumns,
  });

  const filterColumns = availableColumns.filter(({ name }) =>
    quickFilters?.includes(name)
  );

  return (
    <div className={classBase} ref={rootRef}>
      <div className={`${classBase}-filter-container`}>
        <FormField data-embedded data-field="find">
          <FormFieldLabel>Find</FormFieldLabel>
          <VuuInput
            inputProps={{
              onChange,
            }}
            onCommit={onCommit}
            startAdornment={searchIcon}
            variant="secondary"
          />
        </FormField>
        {filterColumns?.map((column) => (
          <FormField key={column.label ?? column.name} data-field={column.name}>
            <FormFieldLabel>{column.label ?? column.name}</FormFieldLabel>
            {getDataItemEditControl({
              column,
              onCommit,
              suggestionProvider,
              table: tableSchema?.table,
            })}
          </FormField>
        ))}
      </div>
      <ColumnPicker
        columns={availableColumnNames}
        icon="more-horiz"
        iconSize={16}
        onSelectionChange={onColumnsSelectionChange}
        selected={quickFilters}
      />
    </div>
  );
};
