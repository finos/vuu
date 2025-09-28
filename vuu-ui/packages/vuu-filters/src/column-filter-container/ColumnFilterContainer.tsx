import cx from "clsx";
import {
  useCallback,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  ColumnFilterContext,
  useColumnFilterContainer,
  useFilterContext,
  type ColumnFilterContainerHookProps,
} from "./useColumnFilterContainer";
import {
  ColumnFilterChangeHandler,
  ColumnFilterValue,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnFilterNext,
  ColumnFilterNextProps,
} from "../column-filter-next/ColumnFilterNext";
import { ColumnFilterCommitHandler } from "../column-filter/useColumnFilter";

const classBase = "vuuFilterContainer";

export interface FilterContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    ColumnFilterContainerHookProps {
  children: ReactNode;
}

export interface FilterContainerColumnFilterProps
  extends Omit<ColumnFilterNextProps, "defaultValue" | "onCommit" | "value"> {
  defaultValue?: ColumnFilterValue;
}

export const FilterContainerColumnFilter = ({
  column,
  operator = "=",
  ...props
}: FilterContainerColumnFilterProps) => {
  const {
    onChange: onFilterContextChange,
    onCommit: onFilterContextCommit,
    register,
  } = useFilterContext(column, true);

  console.log(`%c[FilterContainerColumnFilter] render`, "color:red");

  const defaultValue = useMemo(
    () => register(column, operator),
    [column, operator, register],
  );
  const valueRef = useRef<ColumnFilterValue>(defaultValue);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      onFilterContextCommit(column, op, value);
    },
    [onFilterContextCommit],
  );

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      const { current: v } = valueRef;
      valueRef.current = Array.isArray(v) ? [`${value}`, v[1]] : value;
      onFilterContextChange(valueRef.current, column, op);
    },
    [onFilterContextChange],
  );

  const handleColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      const { current: v } = valueRef;
      valueRef.current = Array.isArray(v) ? [v[0], `${value}`] : value;
      onFilterContextChange(valueRef.current, column, op);
    },
    [onFilterContextChange],
  );

  return (
    <ColumnFilterNext
      {...props}
      column={column}
      defaultValue={defaultValue}
      onColumnFilterChange={handleColumnFilterChange}
      onColumnRangeFilterChange={handleColumnRangeFilterChange}
      onCommit={handleCommit}
      operator={operator}
    />
  );
};

export const ColumnFilterContainer = ({
  children,
  className,
  filter,
  onFilterApplied,
  onFilterCleared,
  ...htmlAttributes
}: FilterContainerProps) => {
  const filterContextProps = useColumnFilterContainer({
    filter,
    onFilterApplied,
    onFilterCleared,
  });
  return (
    <ColumnFilterContext.Provider value={filterContextProps}>
      <div {...htmlAttributes} className={cx(classBase, className)}>
        {children}
      </div>
    </ColumnFilterContext.Provider>
  );
};
