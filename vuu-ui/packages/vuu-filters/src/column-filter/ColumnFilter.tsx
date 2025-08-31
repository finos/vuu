import {
  Button,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  SegmentedButtonGroup,
  SegmentedButtonGroupProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import columnFilterCss from "./ColumnFilter.css";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { ForwardedRef, forwardRef, ReactElement, useMemo } from "react";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { assertValidValue, Operator, useColumnFilter } from "./useColumnFilter";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { FilterOp } from "@vuu-ui/vuu-filter-types";

const classBase = "vuuColumnFilter";
export type FilterValue = string | readonly string[] | number;
export type ColumnFilterValue = FilterValue | [FilterValue, FilterValue];

export interface ColumnFilterProps extends SegmentedButtonGroupProps {
  column: ColumnDescriptor;
  operator?: FilterOp | "between";
  showOperatorPicker?: boolean;
  /**
   * VuuTable is required if typeahead support is expected.
   */
  table?: VuuTable;
  /**
   * Filter value. Pair of values expected when operator is
   * 'between'
   */
  value?: ColumnFilterValue;
  /**
   * Filter change events.
   */
  onFilterChange?: (
    value: ColumnFilterValue | undefined,
    columnName: string,
    op: Operator,
  ) => void;
}

export const ColumnFilter = forwardRef(function ColumnFilter(
  {
    column,
    className,
    operator = "=",
    showOperatorPicker = false,
    table,
    value,
    onFilterChange,
    ...buttonGroupProps
  }: ColumnFilterProps,
  forwardRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-filter",
    css: columnFilterCss,
    window: targetWindow,
  });

  const {
    op,
    filterValue,
    inputProps,
    rangeInputProps,
    onOperatorChange,
    handleCommit,
    handleRangeCommit,
  } = useColumnFilter({
    column,
    operator,
    value,
    onFilterChange,
  });

  useMemo(
    () => assertValidValue(column, op, filterValue),
    [column, op, filterValue],
  );

  return (
    <SegmentedButtonGroup
      {...buttonGroupProps}
      className={cx(classBase, className)}
      ref={forwardRef}
    >
      {showOperatorPicker ? (
        <Menu placement="bottom-start">
          <MenuTrigger>
            <Button
              appearance="solid"
              aria-label="Open Menu"
              className={`${classBase}-trigger`}
              data-embedded
              sentiment="neutral"
            >
              {op}
            </Button>
          </MenuTrigger>
          <MenuPanel>
            <MenuItem onClick={() => onOperatorChange("=")}>=</MenuItem>
            <MenuItem onClick={() => onOperatorChange("!=")}>!=</MenuItem>
            <MenuItem onClick={() => onOperatorChange("starts")}>
              starts
            </MenuItem>
            <MenuItem onClick={() => onOperatorChange("ends")}>ends</MenuItem>
            <MenuItem onClick={() => onOperatorChange("contains")}>
              contains
            </MenuItem>
            <MenuItem onClick={() => onOperatorChange("between")}>
              between
            </MenuItem>
          </MenuPanel>
        </Menu>
      ) : null}
      {getDataItemEditControl({
        InputProps: { inputProps },
        dataDescriptor: column,
        onCommit: handleCommit,
        defaultValue: Array.isArray(filterValue) ? filterValue[0] : filterValue,
        table,
      })}
      {op === "between"
        ? getDataItemEditControl({
            className: `${classBase}-rangeHigh`,
            InputProps: { inputProps: rangeInputProps },
            dataDescriptor: column,
            onCommit: handleRangeCommit,
            defaultValue: Array.isArray(filterValue)
              ? filterValue[1]
              : filterValue,
            table,
          })
        : null}
    </SegmentedButtonGroup>
  );
}) as (
  props: ColumnFilterProps & {
    ref?: ForwardedRef<HTMLDivElement>;
  },
) => ReactElement<ColumnFilterProps>;
