import type {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  ExtendedFilterOptions,
} from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { type InputProps, useControlled } from "@salt-ds/core";
import {
  type ChangeEventHandler,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  type CommitHandler,
  isBetweenOperator,
  isTemporalColumn,
  isValidRange,
} from "@vuu-ui/vuu-utils";
import type { DataItemEditControlProps } from "@vuu-ui/vuu-data-editing";
import {
  getColumnFilterOperators,
  getDefaultColumnFilterOperator,
  normalizeColumnFilterValue,
  type SelectableColumnFilterOp,
} from "./column-filter-utils";
import {
  formatNumericText,
  getNumericValueError,
  getNumericValueHint,
  parseNumericValue,
} from "../filter-bar/filter-clause/value-editors/numeric-value-utils";

/**
 * Text typed into a numeric filter is parsed, so shorthand like 30bn or 1,500
 * is committed as the number it represents. Text that is not a number is
 * undefined, so nothing is committed.
 */
const toNumericCommitValue = (
  text: string,
  integerOnly: boolean,
): string | undefined => {
  if (text.trim() === "") {
    return "";
  }
  const value = parseNumericValue(text, integerOnly);
  return value === undefined ? undefined : `${value}`;
};

const toNumericCommitValues = (
  value: ColumnFilterValue,
  integerOnly: boolean,
): ColumnFilterValue | undefined => {
  if (Array.isArray(value)) {
    const [low, high] = value.map((v) => toNumericCommitValue(v, integerOnly));
    return low === undefined || high === undefined ? undefined : [low, high];
  } else {
    return toNumericCommitValue(`${value}`, integerOnly);
  }
};

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
  // numeric columns accept shorthand, e.g. 30bn
  // int, long and double columns. Scaled decimal values are decimal strings,
  // kept as entered.
  const isNumeric =
    !isTemporalColumn(column) &&
    (column.serverDataType === "int" ||
      column.serverDataType === "long" ||
      column.serverDataType === "double");
  const integerOnly =
    column.serverDataType === "int" || column.serverDataType === "long";
  // which input, if any, holds text being typed. Other inputs show a
  // committed numeric value in shorthand.
  const [editing, setEditing] = useState<"low" | "high" | undefined>();
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
        const commitValue = isNumeric
          ? toNumericCommitValues(newValue, integerOnly)
          : newValue;
        const valid =
          commitValue !== undefined &&
          (!Array.isArray(commitValue) || isValidRange(commitValue));
        setIsInvalid(!valid);
        if (valid) {
          setEditing(undefined);
          onCommit(column, newOperator, commitValue, extendedFilterOptions);
        }
      }
    },
    [
      column,
      extendedFilterOptions,
      integerOnly,
      isNumeric,
      onCommit,
      onOperatorChange,
      operator,
      setOperator,
      setValue,
      value,
    ],
  );

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, typedValue = "") => {
      let newValue = typedValue;
      if (isNumeric) {
        const numericValue = toNumericCommitValue(`${typedValue}`, integerOnly);
        if (numericValue === undefined) {
          // the inline error explains, nothing is applied
          return;
        }
        newValue = numericValue;
        setEditing(undefined);
      }
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
            "[useColumnFilterNext] value has been initialised incorrectly for non-range filter",
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
      integerOnly,
      isNumeric,
      showOperatorPicker,
    ],
  );

  const handleRangeCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, typedValue = "") => {
      let newValue = typedValue;
      if (isNumeric) {
        const numericValue = toNumericCommitValue(`${typedValue}`, integerOnly);
        if (numericValue === undefined) {
          return;
        }
        newValue = numericValue;
        setEditing(undefined);
      }
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
          "[useColumnFilterNext] value has been initialised incorrectly for range filter",
        );
      }
    },
    [
      value,
      setValue,
      onCommit,
      column,
      operator,
      extendedFilterOptions,
      integerOnly,
      isNumeric,
    ],
  );

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value = "" } = e.target;
      setEditing("low");
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
      setEditing("high");
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

  const lowValue = Array.isArray(value) ? value[0] : value;
  const highValue = Array.isArray(value) ? value[1] : undefined;
  const lowText = lowValue === undefined ? "" : `${lowValue}`;
  const highText = highValue ?? "";
  const errorMessage = isNumeric
    ? getNumericValueError(lowText, integerOnly)
    : undefined;
  const errorMessageRange = isNumeric
    ? getNumericValueError(highText, integerOnly)
    : undefined;

  const InputProps = useMemo(
    () =>
      injectInputProps(InputPropsProp, {
        onChange,
        ...(isNumeric
          ? {
              title: getNumericValueHint(lowText, integerOnly),
              value: editing === "low" ? lowText : formatNumericText(lowText),
            }
          : { value: lowValue }),
      }),
    [
      InputPropsProp,
      editing,
      integerOnly,
      isNumeric,
      lowText,
      lowValue,
      onChange,
    ],
  );

  const InputPropsRange = useMemo(
    () =>
      injectInputProps(
        InputPropsProp,
        highValue !== undefined
          ? {
              onChange: onRangeInputChange,
              ...(isNumeric
                ? {
                    title: getNumericValueHint(highValue, integerOnly),
                    value:
                      editing === "high"
                        ? highValue
                        : formatNumericText(highValue),
                  }
                : { value: highValue }),
            }
          : undefined,
      ),
    [
      InputPropsProp,
      editing,
      highValue,
      integerOnly,
      isNumeric,
      onRangeInputChange,
    ],
  );

  return {
    InputProps,
    InputPropsRange,
    errorMessage,
    errorMessageRange,
    isInvalid:
      errorMessage !== undefined ||
      errorMessageRange !== undefined ||
      (showOperatorPicker
        ? Array.isArray(value) && !isValidRange(value)
        : isInvalid),
    onCommit: handleCommit,
    onCommitRange: handleRangeCommit,
    operator,
    operators,
    onOperatorSelect: handleOperatorSelect,
  };
};
