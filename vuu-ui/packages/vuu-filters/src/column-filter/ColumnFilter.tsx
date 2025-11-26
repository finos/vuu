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
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import columnFilterCss from "./ColumnFilter.css";

const classBase = "vuuColumnFilter";

export interface ColumnFilterProps
  extends ColumnFilterHookProps,
    Omit<SegmentedButtonGroupProps, "defaultValue">,
    Pick<
      DataItemEditControlProps,
      "TypeaheadProps" | "table" | "values" | "variant"
    > {}

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
    values,
    variant,
    ...buttonGroupProps
  }: ColumnFilterProps,
  forwardRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-editor",
    css: columnFilterCss,
    window: targetWindow,
  });

  const { InputProps, InputPropsRange, isInvalid, onCommit, onCommitRange } =
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

  console.log(`render , isInvalid ${isInvalid}`);

  return (
    <SegmentedButtonGroup
      {...buttonGroupProps}
      className={cx(classBase, className, {
        [`${classBase}-invalid`]: isInvalid,
      })}
      ref={forwardRef}
    >
      {getDataItemEditControl({
        InputProps,
        TypeaheadProps,
        commitWhenCleared: true,
        dataDescriptor: column,
        onCommit,
        table,
        values,
        variant,
      })}
      {operator.startsWith("between")
        ? getDataItemEditControl({
            InputProps: InputPropsRange,
            className: `${classBase}-rangeHigh`,
            commitWhenCleared: true,
            variant,
            dataDescriptor: column,
            onCommit: onCommitRange,
            table,
          })
        : null}
    </SegmentedButtonGroup>
  );
});
