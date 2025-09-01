import { FilterClauseOp, FilterOp } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  ColumnFilterProps,
  ColumnFilterValue,
  FilterValue,
} from "./ColumnFilter";
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

export type Operator = FilterOp | "between";

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
  value?: ColumnFilterValue,
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
      } else if (typeof value[0] !== typeof value[1]) {
        throw Error(
          `[useColumnFilter] 'between operator values must be of same type, received ${typeof value[0]} and ${typeof value[1]}`,
        );
      }
    }
    // TODO validate value(s) against serverDataType
  }
};

export type ColumnFilterHookProps = Pick<
  ColumnFilterProps,
  "column" | "onFilterChange" | "defaultValue" | "value" | "operator"
>;

export const useColumnFilter = ({
  operator = "=",
  value,
  column,
  onFilterChange,
}: ColumnFilterHookProps) => {
  const filterValue = useRef(value);
  const [op, setOp] = useState(operator);
  const allowedOperators = useMemo(() => getOperators(column), [column]);

  useMemo(() => {
    if (value && value !== filterValue.current) {
      filterValue.current = value;
      setTimeout(() => {
        onFilterChange?.(value, column.name, op);
      }, 100);
    }
  }, [value, column, op, onFilterChange]);

  const handleOperatorChange = useCallback(
    (op: Operator) => {
      setOp(op);
      onFilterChange?.(filterValue.current, column.name, op);
    },
    [column, onFilterChange],
  );

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (e, newValue) => {
      if (Array.isArray(filterValue.current)) {
        filterValue.current = [
          newValue as FilterValue,
          filterValue.current[1] as FilterValue,
        ];
        if (
          filterValue.current &&
          (filterValue.current[0] === undefined ||
            filterValue.current[1] === undefined)
        ) {
          console.info(
            "Range start or end value missing - ignoring onFilterChange",
          );
          return;
        }
      } else {
        filterValue.current = newValue as FilterValue;
      }
      onFilterChange?.(filterValue.current, column.name, op);
    },
    [op, column, onFilterChange],
  );

  const handleRangeCommit = useCallback<CommitHandler<HTMLElement>>(
    (e, newValue) => {
      if (Array.isArray(filterValue.current)) {
        filterValue.current = [
          filterValue.current[0] as FilterValue,
          newValue as FilterValue,
        ];
        if (
          filterValue.current &&
          (filterValue.current[0] === undefined ||
            filterValue.current[1] === undefined)
        ) {
          console.info(
            "Range start or end value missing - ignoring onFilterChange",
          );
          return;
        }
      } else {
        filterValue.current = newValue as FilterValue;
      }
      onFilterChange?.(filterValue.current, column.name, op);
    },
    [op, column, onFilterChange],
  );

  const handleInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (Array.isArray(filterValue.current)) {
        const input = queryClosest(e.target, ".saltPillInput");
        const updated: [FilterValue, FilterValue] = [
          (!input?.className?.includes("rangeHigh")
            ? e.target.value
            : filterValue.current[0]) as FilterValue,
          (input?.className?.includes("rangeHigh")
            ? e.target.value
            : filterValue.current[1]) as FilterValue,
        ];
        filterValue.current = updated;
        if (updated[0] !== undefined && updated[1] !== undefined) {
          onFilterChange?.(updated, column.name, op);
        }
      } else {
        filterValue.current = e.target.value as FilterValue;
        onFilterChange?.(e.target.value as FilterValue, column.name, op);
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
    onOperatorChange: handleOperatorChange,
  };
};
