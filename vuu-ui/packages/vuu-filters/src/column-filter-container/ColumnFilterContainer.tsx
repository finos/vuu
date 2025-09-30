import cx from "clsx";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
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
import {
  filterDescriptorHasFilter,
  isNullFilter,
  useCurrentFilter,
} from "../filter-provider/FilterProvider";
import { getColumnValueFromFilter } from "@vuu-ui/vuu-utils";

const classBase = "vuuFilterContainer";

const notEmpty = (value: ColumnFilterValue) =>
  Array.isArray(value) ? value[0] !== "" && value[1] !== "" : value !== "";

export interface ColumnFilterContainerProps
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

  const initialValue = useMemo(
    () => register(column, operator),
    [column, operator, register],
  );

  const [value, setValue] = useState(initialValue);
  const valueRef = useRef<ColumnFilterValue>(initialValue);
  const { currentFilter } = useCurrentFilter();

  // This is primarily to guard against client passing non-stable 'column' reference
  // which would trigger the commit check below.
  const currentFilterRef = useRef(currentFilter.id);

  useMemo(() => {
    if (currentFilterRef.current !== currentFilter.id) {
      currentFilterRef.current = currentFilter.id;

      if (isNullFilter(currentFilter) && notEmpty(valueRef.current)) {
        valueRef.current = Array.isArray(valueRef.current) ? ["", ""] : "";
        setValue(valueRef.current);
      } else if (filterDescriptorHasFilter(currentFilter)) {
        const v = getColumnValueFromFilter(
          column,
          operator,
          currentFilter.filter,
        );
        if (
          operator === "between" &&
          !Array.isArray(v) &&
          Array.isArray(valueRef.current)
        ) {
          // A between filter with only the first item filled is converted to an '=' filter
          // in FilterAggregator. Translate value back to range value here
          const [v1, v2] = valueRef.current;
          if (`${v}` === v1 && v2 === "") {
            return;
          } else {
            valueRef.current = [`${v}`, ""];
            setValue(valueRef.current);
          }
        } else if (v !== valueRef.current) {
          valueRef.current = v;
          setValue(v);
        }
      }
    }
    // We only want this to run when the filter id changes, not when
    // filter instance changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column, currentFilter.id]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      valueRef.current = value;
      setValue(value);
      onFilterContextCommit(column, op, value);
    },
    [onFilterContextCommit],
  );

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      const { current: v } = valueRef;
      valueRef.current = Array.isArray(v) ? [`${value}`, v[1]] : value;
      setValue(valueRef.current);
      onFilterContextChange(valueRef.current, column, op);
    },
    [onFilterContextChange],
  );

  const handleColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      const { current: v } = valueRef;
      valueRef.current = Array.isArray(v) ? [v[0], `${value}`] : value;
      setValue(valueRef.current);
      onFilterContextChange(valueRef.current, column, op);
    },
    [onFilterContextChange],
  );

  return (
    <ColumnFilterNext
      {...props}
      column={column}
      onColumnFilterChange={handleColumnFilterChange}
      onColumnRangeFilterChange={handleColumnRangeFilterChange}
      onCommit={handleCommit}
      operator={operator}
      value={value}
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
}: ColumnFilterContainerProps) => {
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
