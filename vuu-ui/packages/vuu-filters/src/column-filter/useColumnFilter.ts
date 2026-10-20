import {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  ExtendedFilterOptions,
} from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { InputProps, useControlled } from "@salt-ds/core";
import {
  ChangeEventHandler,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  CommitHandler,
  isBetweenOperator,
  isValidRange,
} from "@vuu-ui/vuu-utils";
import { DataItemEditControlProps } from "@vuu-ui/vuu-data-react";
import {
  getColumnFilterOperators,
  getDefaultColumnFilterOperator,
  normalizeColumnFilterValue,
  type SelectableColumnFilterOp,
} from "./column-filter-utils";

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

export interface ColumnFilterHookProps
  extends Pick<DataItemEditControlProps, "InputProps"> {
  column: ColumnDescriptor;
  /**
   * Filter defaultValue. Pair of values expected when operator is
   * 'between'. If provided, component is uncontrolled
   */

  defaultValue?: ColumnFilterValue;
  /**
   * Provides for custom filters.
   */
  extendedFilterOptions?: ExtendedFilterOptions;

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
  /** Controlled operator. Defaults to '=' when the picker is hidden. */
  operator?: ColumnFilterOp;
  /** Initial operator for an uncontrolled picker. Defaults to '=' or the first option. */
  defaultOperator?: ColumnFilterOp;
  /** Render an operator dropdown before the value. Defaults to false. */
  showOperatorPicker?: boolean;
  /** Ordered operator options, replacing the column-type defaults. 'in' is not supported. */
  operators?: readonly SelectableColumnFilterOp[];
  /** Called before committing the current value with the newly selected operator. */
  onOperatorChange?: (event: SyntheticEvent, operator: ColumnFilterOp) => void;
  /**
   * Filter value. Pair of values expected when operator is
   * 'between'. If provided, component is controlled.
   */
  value?: ColumnFilterValue;
}

export const useColumnFilter = ({
  InputProps: InputPropsProp,
  column,
  defaultValue,
  defaultOperator,
  extendedFilterOptions,
  onColumnFilterChange,
  onColumnRangeFilterChange,
  onCommit,
  onOperatorChange,
  operator: operatorProp,
  operators: operatorsProp,
  showOperatorPicker = false,
  value: valueProp,
}: ColumnFilterHookProps) => {
  const [isInvalid, setIsInvalid] = useState(false);
  const operators = useMemo(
    () =>
      showOperatorPicker
        ? getColumnFilterOperators(column, operatorsProp)
        : undefined,
    [column, operatorsProp, showOperatorPicker],
  );
  const [selectedOperator, setOperator] = useControlled({
    controlled: operatorProp,
    default: operators
      ? getDefaultColumnFilterOperator(operators, defaultOperator)
      : (defaultOperator ?? "="),
    name: "ColumnFilter",
    state: "operator",
  });
  const operator = operators
    ? getDefaultColumnFilterOperator(operators, selectedOperator)
    : selectedOperator;
  const [rawValue, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: "ColumnFilter",
    state: "value",
  });
  const value = showOperatorPicker
    ? normalizeColumnFilterValue(operator, rawValue)
    : rawValue;

  const handleOperatorSelect = useCallback(
    (event: SyntheticEvent, newOperator: ColumnFilterOp) => {
      if (newOperator === operator) return;
      const newValue = normalizeColumnFilterValue(newOperator, value);
      setOperator(newOperator);
      setValue(newValue);
      setIsInvalid(false);
      onOperatorChange?.(event, newOperator);
      const hadValue = Array.isArray(value)
        ? value.some((v) => v !== "")
        : value !== undefined && value !== "";
      if (hadValue) {
        const valid = !Array.isArray(newValue) || isValidRange(newValue);
        setIsInvalid(!valid);
        if (valid) {
          onCommit(column, newOperator, newValue, extendedFilterOptions);
        }
      }
    },
    [
      column,
      extendedFilterOptions,
      onCommit,
      onOperatorChange,
      operator,
      setOperator,
      setValue,
      value,
    ],
  );

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, newValue = "") => {
      if (Array.isArray(value)) {
        if (isBetweenOperator(operator)) {
          const newRange: [string, string] = [`${newValue}`, value[1]];
          setValue(newRange);
          if (showOperatorPicker && !isValidRange(newRange)) {
            setIsInvalid(true);
            return;
          }
          setIsInvalid(false);
          onCommit?.(
            column,
            operator,
            [`${newValue}`, value[1]],
            extendedFilterOptions,
          );
        } else {
          throw Error(
            `[useColumnFilterNext] value has been initialised incorrectly for non-range filter`,
          );
        }
      } else {
        setValue(newValue as ColumnFilterValue);
        onCommit?.(column, operator, `${newValue}`, extendedFilterOptions);
      }
    },
    [
      value,
      operator,
      setValue,
      onCommit,
      column,
      extendedFilterOptions,
      showOperatorPicker,
    ],
  );

  const handleRangeCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, newValue = "") => {
      if (Array.isArray(value)) {
        const [firstValue] = value as [string, string];
        const newRange: [string, string] = [value[0], `${newValue}`];
        setValue(newRange);
        const validRange = isValidRange(newRange);
        setIsInvalid(!validRange);
        if (validRange) {
          onCommit?.(
            column,
            operator,
            [firstValue, `${newValue}`],
            extendedFilterOptions,
          );
        }
      } else if (value !== "") {
        // If we have already committed the first value, filter has been
        // saved as a single value  '='.
        const currentValue = `${value}`;
        setValue([currentValue, `${newValue}`]);
        onCommit?.(
          column,
          operator,
          [currentValue, `${newValue}`],
          extendedFilterOptions,
        );
      } else {
        throw Error(
          `[useColumnFilterNext] value has been initialised incorrectly for range filter`,
        );
      }
    },
    [value, setValue, onCommit, column, operator, extendedFilterOptions],
  );

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value = "" } = e.target;
      setValue((v) => {
        const current = showOperatorPicker
          ? normalizeColumnFilterValue(operator, v)
          : v;
        return Array.isArray(current) ? [value, current[1]] : value;
      });
      onColumnFilterChange?.(e.target.value, column, operator);
    },
    [column, onColumnFilterChange, operator, setValue, showOperatorPicker],
  );

  const onRangeInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value = "" } = e.target;
      setValue((v) => {
        const current = showOperatorPicker
          ? normalizeColumnFilterValue(operator, v)
          : v;
        return Array.isArray(current) ? [current[0], value] : value;
      });

      onColumnRangeFilterChange?.(value, column, operator);
    },
    [setValue, onColumnRangeFilterChange, column, operator, showOperatorPicker],
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
    isInvalid: showOperatorPicker
      ? Array.isArray(value) && !isValidRange(value)
      : isInvalid,
    onCommit: handleCommit,
    onCommitRange: handleRangeCommit,
    operator,
    operators,
    onOperatorSelect: handleOperatorSelect,
  };
};
