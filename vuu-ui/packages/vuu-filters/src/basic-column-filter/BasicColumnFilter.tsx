import { FormField, FormFieldLabel } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { HTMLAttributes } from "react";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { FilterBarProps } from "../filter-bar";
import { useBasicColumnFilter } from "./useBasicColumnFilter";

import basicColumnFilterCss from "./BasicColumnFilter.css";

export type FilterValue = string | number;

const classBase = "vuuBasicColumnFilter";

export interface BasicColumnFilterProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<FilterBarProps, "onApplyFilter"> {
  /**
   * Column Attributes.
   */
  column: ColumnDescriptor;
  /**
   * VuuTable is required if typeahead support is expected.
   */
  table?: VuuTable;
  /**
   * Initial filter value.
   */
  initialValue?: FilterValue;
  /**
   * Active filter.
   */
  active?: boolean;
}

export const BasicColumnFilter = ({
  column,
  className,
  table,
  initialValue,
  active = false,
  onApplyFilter,
  ...htmlAttributes
}: BasicColumnFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-basic-column-filter",
    css: basicColumnFilterCss,
    window: targetWindow,
  });

  const { filterValue, rootRef, onInputChange, onCommit } =
    useBasicColumnFilter({
      column,
      active,
      initialValue,
      onApplyFilter,
    });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)} ref={rootRef}>
      <FormField key={column.label ?? column.name} data-field={column.name}>
        <FormFieldLabel className={cx({ active })}>
          {column.label ?? column.name}
        </FormFieldLabel>
        <div className={`${classBase}-edit-control`}>
          <div className={`${classBase}-search-icon`}>
            <Icon name="search" size={18} />
          </div>
          {getDataItemEditControl({
            InputProps: {
              inputProps: {
                placeholder: "Find",
                value: filterValue,
                onChange: onInputChange,
              },
            },
            dataDescriptor: column,
            table,
            onCommit,
          })}
        </div>
      </FormField>
    </div>
  );
};
