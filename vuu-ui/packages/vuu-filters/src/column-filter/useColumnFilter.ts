import {
  ColumnFilterChangeHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  FilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import { CommitHandler, queryClosest } from "@vuu-ui/vuu-utils";
import { VuuTypeaheadInputProps } from "@vuu-ui/vuu-ui-controls";
import { getOperators } from "../filter-clause/operator-utils";

export const assertValidOperator = (
  allowedOperators: FilterClauseOp[],
  column: ColumnDescriptor,
  op: ColumnFilterOp,
) => {
  if (op !== "between" && !allowedOperators.includes(op)) {
    console.warn(
      `[useColumnFilter] '${op} not supported for column ${column.name}'`,
    );
  }
};

export type ColumnFilterCommitHandler = (
  column: ColumnDescriptor,
  op: FilterClauseOp | "between",
  value: ColumnFilterValue,
) => void;

export const assertValidValue = (
  { serverDataType: _ }: ColumnDescriptor,
  operator: ColumnFilterOp,
  value?: ColumnFilterValue,
) => {
  if (value !== undefined) {
    if (operator === "between") {
      if (!Array.isArray(value) || value.length !== 2) {
        throw Error(
          `[useColumnFilter] between operator requires array of two values, received ${value}`,
        );
      } else if (
        value[0] !== undefined &&
        value[1] !== undefined &&
        typeof value[0] !== typeof value[1]
      ) {
        throw Error(
          `[useColumnFilter] 'between operator values must be of same type, received ${typeof value[0]} and ${typeof value[1]}`,
        );
      }
    }
    // TODO validate value(s) against serverDataType
  }
};

export type ColumnFilterHookProps = {
  column: ColumnDescriptor;
  operator?: ColumnFilterOp;
  /**
   * Filter value. Pair of values expected when operator is
   * 'between'
   */
  value?: ColumnFilterValue;
  /**
   * Filter change events.
   */
  onColumnFilterChange?: ColumnFilterChangeHandler;
  /**
   * Called when user 'commits' filter value, either by pressing enter,
   * tabbing away from control or making selection from list
   */
  onCommit: ColumnFilterCommitHandler;
};

export const useColumnFilter = ({
  onCommit,
  operator = "=",
  value,
  column,
  onColumnFilterChange,
}: ColumnFilterHookProps) => {
  const [op, setOp] = useState(operator);
  const allowedOperators = useMemo(() => getOperators(column), [column]);

  useMemo(() => {
    assertValidOperator(allowedOperators, column, operator);
    assertValidValue(column, op, value);
  }, [allowedOperators, column, operator, op, value]);

  const handleOperatorChange = useCallback((changedOp: ColumnFilterOp) => {
    setOp(changedOp);
  }, []);

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, newValue) => {
      if (Array.isArray(value)) {
        onCommit?.(column, op, [`${newValue}`, value[1]]);
      } else {
        onCommit?.(column, op, `${newValue}`);
      }
    },
    [value, onCommit, column, op],
  );

  const handleRangeCommit = useCallback<CommitHandler<HTMLElement>>(
    (_e, newValue) => {
      const [firstValue] = value as [string, string];
      onCommit?.(column, op, [firstValue, `${newValue}`]);
    },
    [onCommit, column, op, value],
  );

  const handleInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (Array.isArray(value)) {
        const editControl = queryClosest(e.target, "[data-edit-control]", true);
        const updated: ColumnFilterValue = [
          !editControl.className.includes("rangeHigh")
            ? e.target.value
            : value[0],
          editControl.className?.includes("rangeHigh")
            ? e.target.value
            : value[1],
        ];
        onColumnFilterChange?.(updated, column, op);
      } else {
        onColumnFilterChange?.(e.target.value, column, op);
      }
    },
    [value, onColumnFilterChange, column, op],
  );

  const inputProps = useMemo<VuuTypeaheadInputProps["inputProps"]>(
    () => ({
      onChange: handleInputChange,
      value: Array.isArray(value) ? value[0] : value,
    }),
    [handleInputChange, value],
  );

  const rangeInputProps = useMemo<VuuTypeaheadInputProps["inputProps"]>(
    () =>
      Array.isArray(value)
        ? {
            onChange: handleInputChange,
            value: value[1],
          }
        : undefined,
    [handleInputChange, value],
  );

  return {
    op,
    allowedOperators,
    inputProps,
    rangeInputProps,
    onCommit: handleCommit,
    onCommitRange: handleRangeCommit,
    handleOperatorChange,
  };
};
