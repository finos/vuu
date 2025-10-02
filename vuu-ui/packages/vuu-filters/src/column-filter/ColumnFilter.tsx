import {
  SegmentedButtonGroup,
  type SegmentedButtonGroupProps,
} from "@salt-ds/core";
import {
  DataItemEditControlProps,
  getDataItemEditControl,
} from "@vuu-ui/vuu-data-react";
import cx from "clsx";
import { ForwardedRef, forwardRef } from "react";
import { ColumnFilterHookProps, useColumnFilter } from "./useColumnFilter";

const classBase = "vuuColumnFilter";

export interface ColumnFilterProps
  extends ColumnFilterHookProps,
    Omit<SegmentedButtonGroupProps, "defaultValue">,
    Pick<DataItemEditControlProps, "TypeaheadProps" | "table"> {}

export const ColumnFilter = forwardRef(function ColumnFilter(
  {
    InputProps: InputPropsProp,
    TypeaheadProps,
    className,
    column,
    defaultValue,
    onColumnFilterChange,
    onColumnRangeFilterChange,
    onCommit: onCommitProp,
    operator = "=",
    table,
    value: valueProp,
    ...buttonGroupProps
  }: ColumnFilterProps,
  forwardRef: ForwardedRef<HTMLDivElement>,
) {
  const { InputProps, InputPropsRange, onCommit, onCommitRange } =
    useColumnFilter({
      InputProps: InputPropsProp,
      column,
      defaultValue,
      onColumnFilterChange,
      onColumnRangeFilterChange,
      onCommit: onCommitProp,
      operator,
      value: valueProp,
    });

  return (
    <SegmentedButtonGroup
      {...buttonGroupProps}
      className={cx(classBase, className)}
      ref={forwardRef}
    >
      {getDataItemEditControl({
        InputProps,
        TypeaheadProps,
        commitWhenCleared: true,
        dataDescriptor: column,
        onCommit,
        table,
      })}
      {operator === "between"
        ? getDataItemEditControl({
            InputProps: InputPropsRange,
            className: `${classBase}-rangeHigh`,
            commitWhenCleared: true,
            dataDescriptor: column,
            onCommit: onCommitRange,
            table,
          })
        : null}
    </SegmentedButtonGroup>
  );
});
