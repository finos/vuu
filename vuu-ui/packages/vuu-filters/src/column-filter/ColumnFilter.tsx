import {
  SegmentedButtonGroup,
  type SegmentedButtonGroupProps,
} from "@salt-ds/core";
import {
  DataItemEditControlProps,
  getDataItemEditControl,
} from "@vuu-ui/vuu-data-react";
import cx from "clsx";
import { ForwardedRef, forwardRef, useMemo } from "react";
import { ColumnFilterHookProps, useColumnFilter } from "./useColumnFilter";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import columnFilterCss from "./ColumnFilter.css";
import {
  type DateTimePattern,
  isBetweenOperator,
  withDateTimePattern,
} from "@vuu-ui/vuu-utils";

const classBase = "vuuColumnFilter";

export interface ColumnFilterProps
  extends ColumnFilterHookProps,
    Omit<SegmentedButtonGroupProps, "defaultValue">,
    Pick<
      DataItemEditControlProps,
      "TypeaheadProps" | "labels" | "table" | "values" | "variant"
    > {
  /**
   * Temporal columns only. The date/time pattern used by the filter control,
   * overriding any pattern configured on the column type. The pattern also
   * determines the control rendered: a time picker for a time only pattern
   * (with milliseconds if time is 'hh:mm:ss.ms'), otherwise a date picker.
   * This allows a filter to use different formatting to the Table, e.g.
   * the Table might display nanoseconds whilst the filter accepts a time
   * of day with milliseconds. The column passed to change and commit
   * handlers is the column with this pattern applied (see withDateTimePattern),
   * so that filter values are interpreted consistently with the control.
   */
  pattern?: DateTimePattern;
}

export const ColumnFilter = forwardRef(function ColumnFilter(
  {
    InputProps: InputPropsProp,
    TypeaheadProps,
    className,
    column,
    defaultValue,
    extendedFilterOptions,
    labels,
    onColumnFilterChange,
    onColumnRangeFilterChange,
    onCommit: onCommitProp,
    operator = "=",
    pattern,
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

  const { date, time } = pattern ?? {};
  const controlDescriptor = useMemo(
    () =>
      withDateTimePattern(
        column,
        date || time ? ({ date, time } as DateTimePattern) : undefined,
      ),
    [column, date, time],
  );

  const { InputProps, InputPropsRange, isInvalid, onCommit, onCommitRange } =
    useColumnFilter({
      InputProps: InputPropsProp,
      column: controlDescriptor,
      defaultValue,
      extendedFilterOptions,
      onColumnFilterChange,
      onColumnRangeFilterChange,
      onCommit: onCommitProp,
      operator,
      value: valueProp,
    });

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
        dataDescriptor: controlDescriptor,
        labels,
        onCommit,
        table,
        values,
        variant,
      })}
      {isBetweenOperator(operator)
        ? getDataItemEditControl({
            InputProps: InputPropsRange,
            className: `${classBase}-rangeHigh`,
            commitWhenCleared: true,
            variant,
            dataDescriptor: controlDescriptor,
            onCommit: onCommitRange,
            table,
          })
        : null}
    </SegmentedButtonGroup>
  );
});
