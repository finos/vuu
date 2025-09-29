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
import {
  ColumnFilterNextHookProps,
  useColumnFilterNext,
} from "./useColumnFilterNext";

const classBase = "vuuFilterColumnNext";

export interface ColumnFilterNextProps
  extends ColumnFilterNextHookProps,
    Omit<SegmentedButtonGroupProps, "defaultValue">,
    Pick<DataItemEditControlProps, "TypeaheadProps" | "table"> {}

export const ColumnFilterNext = forwardRef(function ColumnFilterNext(
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
  }: ColumnFilterNextProps,
  forwardRef: ForwardedRef<HTMLDivElement>,
) {
  const { InputProps, InputPropsRange, onCommit, onCommitRange } =
    useColumnFilterNext({
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
