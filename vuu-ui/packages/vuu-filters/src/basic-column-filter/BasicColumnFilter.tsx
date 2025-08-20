import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { ForwardedRef, forwardRef, HTMLAttributes, ReactElement } from "react";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { FilterBarProps } from "../filter-bar";
import { useBasicColumnFilter } from "./useBasicColumnFilter";

import basicColumnFilterCss from "./BasicColumnFilter.css";

export type FilterValue = string | number;

const classBase = "vuuBasicColumnFilter";
const searchIcon = <Icon name="search" size={18} />;

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
   *Show search icon as start adornment.
   */
  withStartAdornment?: boolean;
}

export const BasicColumnFilter = forwardRef(function BasicColumnFilter(
  {
    column,
    className,
    table,
    initialValue,
    onApplyFilter,
    withStartAdornment = true,
    ...htmlAttributes
  }: BasicColumnFilterProps,
  forwardRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-basic-column-filter",
    css: basicColumnFilterCss,
    window: targetWindow,
  });

  const { filterValue, onInputChange, onCommit } = useBasicColumnFilter({
    column,
    initialValue,
    onApplyFilter,
  });

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardRef}
    >
      <div className={`${classBase}-edit-control`}>
        {withStartAdornment && searchIcon}
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
    </div>
  );
}) as (
  props: BasicColumnFilterProps & {
    ref?: ForwardedRef<HTMLDivElement>;
  },
) => ReactElement<BasicColumnFilterProps>;
