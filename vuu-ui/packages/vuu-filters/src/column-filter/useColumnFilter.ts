import { FilterClauseOp, FilterValue } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { CommitHandler, queryClosest } from "@vuu-ui/vuu-utils";
import { VuuTypeaheadInputProps } from "@vuu-ui/vuu-ui-controls";
import { getOperators } from "../filter-clause/operator-utils";

export type Operator = FilterClauseOp | "between";

export const assertValidOperator = (
  allowedOperators: FilterClauseOp[],
  column: ColumnDescriptor,
  op: Operator,
) => {
  if (!allowedOperators.find((filterClauseOp) => filterClauseOp === op)) {
    console.warn(
      `[useColumnFilter] '${op} not supported for column ${column.name}'`,
    );
  }
};

export const assertValidValue = (
  { serverDataType: _ }: ColumnDescriptor,
  operator: Operator,
  value?: FilterValue,
) => {
  if (value !== undefined) {
    if (operator === "between") {
      if (!Array.isArray(value)) {
        throw Error(
          "[useColumnFilter] 'between operator requires array of two values'",
        );
      } else if (value.length !== 2) {
        throw Error(
          `[useColumnFilter] 'between operator requires two values, received ${value}'`,
        );
      } else if (value[0] && value[1] && typeof value[0] !== typeof value[1]) {
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
  operator?: Operator;
  /**
   * Filter value. Pair of values expected when operator is
   * 'between'
   */
  value?: FilterValue;
  /**
   * Filter change events.
   */
  onFilterChange?: (
    value: FilterValue,
    column: ColumnDescriptor,
    op: Operator,
  ) => void;
};

export const useColumnFilter = ({
  operator = "=",
  value,
  column,
  onFilterChange,
}: ColumnFilterHookProps) => {
  const getDefaultValue = (op: Operator) => (op === "between" ? ["", ""] : "");
  const filterValue = useRef(value ?? getDefaultValue(operator));
  const [op, setOp] = useState(operator);
  const allowedOperators = useMemo(() => getOperators(column), [column]);

  useMemo(() => {
    if (value && value !== filterValue.current) {
      filterValue.current = value;
      setTimeout(() => {
        onFilterChange?.(value, column, op);
      }, 100);
    }
  }, [value, column, op, onFilterChange]);

  const handleOperatorChange = useCallback((changedOp: Operator) => {
    setOp(changedOp);
  }, []);

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (e, newValue) => {
      console.log(`[useColumnFilter] handleCommit ${newValue}`);
      if (Array.isArray(filterValue.current)) {
        filterValue.current = [newValue as FilterValue, filterValue.current[1]];
        if (
          filterValue.current &&
          (filterValue.current[0] === undefined ||
            filterValue.current[1] === undefined)
        ) {
          console.info(
            "Range start or end value missing - ignoring onFilterChange",
          );
        }
      } else {
        filterValue.current = newValue as FilterValue;
      }
      onFilterChange?.(filterValue.current, column, op);
    },
    [op, column, onFilterChange],
  );

  const handleRangeCommit = useCallback<CommitHandler<HTMLElement>>(
    (e, newValue) => {
      if (Array.isArray(filterValue.current)) {
        filterValue.current = [filterValue.current[0], newValue as FilterValue];
        if (
          filterValue.current &&
          (filterValue.current[0] === undefined ||
            filterValue.current[1] === undefined)
        ) {
          console.info(
            "Range start or end value missing - ignoring onFilterChange",
          );
        }
      } else {
        filterValue.current = newValue as FilterValue;
      }
      onFilterChange?.(filterValue.current, column, op);
    },
    [op, column, onFilterChange],
  );

  const handleInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (Array.isArray(filterValue.current)) {
        const editControl = queryClosest(e.target, "[data-edit-control]", true);
        const updated: FilterValue = [
          !editControl?.className?.includes("rangeHigh")
            ? e.target.value
            : filterValue.current[0],
          editControl?.className?.includes("rangeHigh")
            ? e.target.value
            : filterValue.current[1],
        ];
        filterValue.current = updated;
        onFilterChange?.(updated, column, op);
      } else {
        filterValue.current = e.target.value;
        onFilterChange?.(e.target.value, column, op);
      }
    },
    [op, column, onFilterChange],
  );

  const inputProps = useMemo<VuuTypeaheadInputProps["inputProps"]>(
    () => ({
      onChange: handleInputChange,
      value: Array.isArray(filterValue.current)
        ? filterValue.current[0]
        : filterValue.current,
    }),
    [handleInputChange],
  );

  const rangeInputProps = useMemo<VuuTypeaheadInputProps["inputProps"]>(
    () => ({
      onChange: handleInputChange,
      value: Array.isArray(filterValue.current)
        ? filterValue.current[1]
        : filterValue.current,
    }),
    [handleInputChange],
  );

  return {
    op,
    allowedOperators,
    filterValue: filterValue.current,
    inputProps,
    rangeInputProps,
    handleCommit,
    handleRangeCommit,
    handleOperatorChange,
  };
};
