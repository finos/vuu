import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ColumnPicker, Icon, VuuInput } from "@vuu-ui/vuu-ui-controls";
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
    Pick<FilterBarProps, "onApplyFilter" | "onClearFilter" | "vuuTable"> {
  allowAddColumn?: boolean;
  allowFind?: boolean;
  availableColumns: ColumnDescriptor[];
  onChangeQuickFilterColumns?: (columns: string[]) => void;
  quickFilterColumns?: string[];
  /**
   * Render a general 'search' control.
   * if true, all columns of type 'string' will be included in the search. Otherwise
   * a list of the columns to include in search can be provided.
   */
  showFind?: boolean | string[];
}

export const QuickFilters = ({
  allowAddColumn = true,
  allowFind = true,
  availableColumns,
  onApplyFilter,
  onClearFilter,
  onChangeQuickFilterColumns,
  quickFilterColumns,
  vuuTable,
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
  } = useQuickFilters({
    availableColumns,
    onApplyFilter,
    onClearFilter,
    onChangeQuickFilterColumns,
    quickFilterColumns,
  });

  const filterColumns = availableColumns.filter(({ name }) =>
    quickFilterColumns?.includes(name),
  );

  const getFilterControls = () => {
    const controls = [];
    if (allowFind) {
      controls.push(
        <FormField data-embedded data-field="find" key="find">
          <FormFieldLabel>Find</FormFieldLabel>
          <VuuInput
            inputProps={{
              onChange,
            }}
            onCommit={onCommit}
            startAdornment={searchIcon}
            variant="secondary"
          />
        </FormField>,
      );
    }
    {
      filterColumns?.forEach((column) =>
        controls.push(
          <FormField key={column.label ?? column.name} data-field={column.name}>
            <FormFieldLabel>{column.label ?? column.name}</FormFieldLabel>
            {getDataItemEditControl({
              dataDescriptor: column,
              onCommit,
              table: vuuTable,
            })}
          </FormField>,
        ),
      );
    }

    return controls;
  };

  return (
    <div className={classBase} ref={rootRef}>
      <div className={`${classBase}-filter-container`}>
        {getFilterControls()}
      </div>
      {allowAddColumn ? (
        <ColumnPicker
          columns={availableColumnNames}
          icon="more-horiz"
          iconSize={16}
          onSelectionChange={onColumnsSelectionChange}
          selected={quickFilterColumns}
        />
      ) : null}
    </div>
  );
};
