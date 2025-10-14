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
  useFilterContainer,
  useFilterContext,
  type ColumnFilterContainerHookProps,
} from "./useFilterContainer";
import {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterValue,
} from "@vuu-ui/vuu-filter-types";
import { ColumnFilter, ColumnFilterProps } from "../column-filter/ColumnFilter";
import { filterDescriptorHasFilter } from "../filter-provider/FilterProvider";
import {
  isNullFilter,
  useCurrentFilter,
} from "../filter-provider/FilterContext";
import { getColumnValueFromFilter } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import filterContainerCss from "./FilterContainer.css";

const classBase = "vuuFilterContainer";

const notEmpty = (value: ColumnFilterValue) =>
  Array.isArray(value) ? value[0] !== "" && value[1] !== "" : value !== "";

export interface FilterContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    ColumnFilterContainerHookProps {
  children: ReactNode;
  filterProviderKey?: string;
}

export interface FilterContainerColumnFilterProps
  extends Omit<ColumnFilterProps, "defaultValue" | "onCommit" | "value"> {
  defaultValue?: ColumnFilterValue;
}

export const FilterContainerColumnFilter = ({
  column,
  operator = "=",
  ...props
}: FilterContainerColumnFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-container",
    css: filterContainerCss,
    window: targetWindow,
  });

  const {
    filterProviderKey,
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
  const { currentFilter } = useCurrentFilter(filterProviderKey);

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
    <ColumnFilter
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

/**
 * FilterContainer is a generic UI container for a collection of Filter
 * controls. Each control manages a single filter clause and the Filter
 * Container aggregates these clauses into a single filter. FilterContainer
 * provides a FilterContainerFilter which can be used to provide children.
 * This is a wrapper around ColumnFilter, which adds some plumbing to allow
 * the container to track changes and manage each individual contribution to
 * the top-level filter.
 * See FilterPanel and InlineFilter for examples of FilterContainer usage.
 */
export const FilterContainer = ({
  children,
  className,
  filter,
  filterProviderKey,
  onFilterApplied,
  onFilterCleared,
  ...htmlAttributes
}: FilterContainerProps) => {
  const filterContextProps = useFilterContainer({
    filter,
    filterProviderKey,
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
