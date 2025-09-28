import {
  ColumnFilterChangeHandler,
  ColumnFilterOp,
  ColumnFilterValue,
} from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ColumnFilterCommitHandler } from "../column-filter/useColumnFilter";
import { InputProps, useControlled } from "@salt-ds/core";
import { ChangeEventHandler, useCallback, useMemo } from "react";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import { DataItemEditControlProps } from "@vuu-ui/vuu-data-react";

const injectInputProps = (
  InputProps: InputProps | undefined,
  inputProps: InputProps["inputProps"],
): InputProps => {
  if (InputProps === undefined) {
    return {
      inputProps,
    };
  } else {
    return {
      ...InputProps,
      inputProps: {
        ...InputProps.inputProps,
        ...inputProps,
      },
    };
  }
};

export interface ColumnFilterNextHookProps
  extends Pick<DataItemEditControlProps, "InputProps"> {
  column: ColumnDescriptor;
  /**
   * Filter defaultValue. Pair of values expected when operator is
   * 'between'. If provided, component is uncontrolled
   */

  defaultValue?: ColumnFilterValue;
  /**
   * Filter change events.
   */
  onColumnFilterChange?: ColumnFilterChangeHandler;
  /**
   * Filter change events on second control in range filter
   */
  onColumnRangeFilterChange?: ColumnFilterChangeHandler;
  /**
   * Called when user 'commits' filter value, either by pressing enter,
   * tabbing away from control or making selection from list
   */
  onCommit: ColumnFilterCommitHandler;
  operator?: ColumnFilterOp;
  /**
   * Filter value. Pair of values expected when operator is
   * 'between'. If provided, component is controlled.
   */
  value?: ColumnFilterValue;
}

export const useColumnFilterNext = ({
  InputProps: InputPropsProp,
  column,
  defaultValue,
  onColumnFilterChange,
  onColumnRangeFilterChange,
  onCommit,
  operator = "=",
  value: valueProp,
}: ColumnFilterNextHookProps) => {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: "ColumnFilterNext",
    state: "value",
  });

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, newValue) => {
      if (Array.isArray(value)) {
        setValue([`${newValue}`, value[1]]);
        onCommit?.(column, operator, [`${newValue}`, value[1]]);
      } else {
        setValue(newValue as ColumnFilterValue);
        onCommit?.(column, operator, `${newValue}`);
      }
    },
    [value, setValue, onCommit, column, operator],
  );

  const handleRangeCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, newValue) => {
      const [firstValue] = value as [string, string];
      onCommit?.(column, operator, [firstValue, `${newValue}`]);
    },
    [onCommit, column, operator, value],
  );

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value = "" } = e.target;
      setValue((v) => (Array.isArray(v) ? [value, v[1]] : undefined));
      onColumnFilterChange?.(e.target.value, column, operator);
    },
    [column, onColumnFilterChange, operator, setValue],
  );

  const onRangeInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value = "" } = e.target;
      setValue((v) => (Array.isArray(v) ? [v[0], value] : undefined));

      onColumnRangeFilterChange?.(value, column, operator);
    },
    [setValue, onColumnRangeFilterChange, column, operator],
  );

  const InputProps = useMemo(
    () =>
      injectInputProps(InputPropsProp, {
        onChange,
        value: Array.isArray(value) ? value[0] : value,
      }),
    [InputPropsProp, onChange, value],
  );
  const InputPropsRange = useMemo(
    () =>
      injectInputProps(
        InputPropsProp,
        Array.isArray(value)
          ? {
              onChange: onRangeInputChange,
              value: value[1],
            }
          : undefined,
      ),
    [InputPropsProp, onRangeInputChange, value],
  );

  return {
    InputProps,
    InputPropsRange,
    onCommit: handleCommit,
    onCommitRange: handleRangeCommit,
  };
};
