import cx from "clsx";
import {
  useCallback,
  useEffect,
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
  ColumnFilterOp,
} from "@vuu-ui/vuu-filter-types";
import { ColumnFilter, ColumnFilterProps } from "../column-filter/ColumnFilter";
import {
  filterDescriptorHasFilter,
  isNullFilter,
  useColumnFilterRegistry,
  useSavedFilters,
  UNSAVED_FILTER,
} from "../filter-provider/FilterContext";
import {
  filtersAreEqual,
  getColumnValueFromFilter,
  getDefaultTimeRange,
  isTimeDataValue,
  withDateTimePattern,
  isBetweenOperator,
  type DateTimePattern,
} from "@vuu-ui/vuu-utils";
import { useControlled } from "@salt-ds/core";
import {
  getColumnFilterOperator,
  getColumnFilterClause,
  getColumnFilterOperators,
  getDefaultColumnFilterOperator,
  normalizeColumnFilterValue,
} from "../column-filter/column-filter-utils";
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
  /**
   * See ColumnFilter pattern. Defaults to the pattern configured for the
   * column by FilterProvider columnFilterPatterns or columnTypeFilterPatterns,
   * if any.
   */
  pattern?: DateTimePattern;
}

export const FilterContainerColumnFilter = ({
  column: columnProp,
  operator: operatorProp,
  defaultOperator,
  showOperatorPicker = false,
  operators,
  onOperatorChange,
  pattern: patternProp,
  variant,
  ...props
}: FilterContainerColumnFilterProps) => {
  const { getColumnFilterPattern } = useColumnFilterRegistry();
  const pattern = patternProp ?? getColumnFilterPattern(columnProp);
  const { date, time } = pattern ?? {};
  const column = useMemo(
    () =>
      withDateTimePattern(
        columnProp,
        date || time ? ({ date, time } as DateTimePattern) : undefined,
      ),
    [columnProp, date, time],
  );
  const {
    filter: containerFilter,
    getFilter,
    filterProviderKey,
    onChange: onFilterContextChange,
    onCommit: onFilterContextCommit,
    register,
  } = useFilterContext(column, true);
  const availableOperators = useMemo(
    () =>
      showOperatorPicker
        ? getColumnFilterOperators(column, operators)
        : undefined,
    [column, operators, showOperatorPicker],
  );
  const [initialOperator] = useState(() =>
    availableOperators
      ? getDefaultColumnFilterOperator(
          availableOperators,
          operatorProp ??
            getColumnFilterOperator(column, containerFilter) ??
            defaultOperator,
        )
      : (defaultOperator ?? "="),
  );
  const [selectedOperator, setOperator] = useControlled<ColumnFilterOp>({
    controlled: operatorProp,
    default: initialOperator,
    name: "FilterContainerColumnFilter",
    state: "operator",
  });
  const operator = selectedOperator;

  const { registerColumnFilterColumn } =
    useColumnFilterRegistry(filterProviderKey);
  useEffect(
    () => registerColumnFilterColumn(column),
    [column, registerColumnFilterColumn],
  );

  const initialValue = useMemo(
    () => register(column, operator),
    [column, operator, register],
  );

  const [value, setValue] = useState(initialValue);
  const valueRef = useRef<ColumnFilterValue>(initialValue);
  if (showOperatorPicker) {
    const normalizedValue = normalizeColumnFilterValue(operator, value);
    if (normalizedValue !== value) {
      valueRef.current = normalizedValue;
      setValue(normalizedValue);
    }
  }
  const { currentFilter } = useSavedFilters(filterProviderKey);

  // This is primarily to guard against client passing non-stable 'column' reference
  // which would trigger the commit check below.
  const currentFilterRef = useRef(currentFilter);
  const containerFilterRef = useRef(containerFilter);
  const localFilterRef = useRef(containerFilter);

  useMemo(() => {
    if (!showOperatorPicker) return;
    const containerChanged = !filtersAreEqual(
      containerFilterRef.current,
      containerFilter,
    );
    const savedChanged =
      currentFilterRef.current.id !== currentFilter.id ||
      !filtersAreEqual(currentFilterRef.current.filter, currentFilter.filter);
    if (containerChanged || savedChanged) {
      const savedIdChanged = currentFilterRef.current.id !== currentFilter.id;
      const filter = containerChanged
        ? containerFilter
        : (currentFilter.filter ?? undefined);
      containerFilterRef.current = containerFilter;
      currentFilterRef.current = currentFilter;
      // Local changes already update the draft, including incomplete ranges and uncommitted values.
      const savedFilterActivated =
        savedIdChanged &&
        filterDescriptorHasFilter(currentFilter) &&
        currentFilter.id !== UNSAVED_FILTER;
      const clause = getColumnFilterClause(column, filter);
      if (
        savedFilterActivated ||
        !filtersAreEqual(
          clause,
          getColumnFilterClause(column, localFilterRef.current),
        )
      ) {
        const nextOperator =
          operatorProp ??
          (availableOperators
            ? getDefaultColumnFilterOperator(
                availableOperators,
                getColumnFilterOperator(column, filter) ?? defaultOperator,
              )
            : operator);
        const nextValue = normalizeColumnFilterValue(
          nextOperator,
          getColumnValueFromFilter(column, nextOperator, clause),
        );
        setOperator(nextOperator);
        valueRef.current = nextValue;
        setValue(nextValue);
        localFilterRef.current = filter;
      }
    }
  }, [
    availableOperators,
    column,
    containerFilter,
    currentFilter,
    defaultOperator,
    operator,
    operatorProp,
    setOperator,
    showOperatorPicker,
  ]);

  useMemo(() => {
    if (
      !showOperatorPicker &&
      (currentFilterRef.current.id !== currentFilter.id ||
        !filtersAreEqual(currentFilterRef.current.filter, currentFilter.filter))
    ) {
      currentFilterRef.current = currentFilter;

      if (isNullFilter(currentFilter) && notEmpty(valueRef.current)) {
        if (Array.isArray(valueRef.current)) {
          if (isTimeDataValue(column)) {
            valueRef.current = getDefaultTimeRange(column);
          } else {
            valueRef.current = ["", ""];
          }
        } else {
          valueRef.current = "";
        }
        setValue(valueRef.current);
      } else if (filterDescriptorHasFilter(currentFilter)) {
        const v = getColumnValueFromFilter(
          column,
          operator,
          currentFilter.filter,
        );
        if (
          isBetweenOperator(operator) &&
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
  }, [column, currentFilter, showOperatorPicker]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value, extendedFilterOptions) => {
      valueRef.current = value;
      setValue(value);
      onFilterContextCommit(column, op, value, extendedFilterOptions);
      localFilterRef.current = getFilter();
    },
    [getFilter, onFilterContextCommit],
  );

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      const { current: v } = valueRef;
      valueRef.current = Array.isArray(v) ? [`${value}`, v[1]] : value;
      setValue(valueRef.current);
      onFilterContextChange(valueRef.current, column, op);
      localFilterRef.current = getFilter();
    },
    [getFilter, onFilterContextChange],
  );

  const handleColumnRangeFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      const { current: v } = valueRef;
      valueRef.current = Array.isArray(v) ? [v[0], `${value}`] : value;
      setValue(valueRef.current);
      onFilterContextChange(valueRef.current, column, op);
      localFilterRef.current = getFilter();
    },
    [getFilter, onFilterContextChange],
  );

  return (
    <ColumnFilter
      {...props}
      column={column}
      onColumnFilterChange={handleColumnFilterChange}
      onColumnRangeFilterChange={handleColumnRangeFilterChange}
      onCommit={handleCommit}
      operator={operator}
      onOperatorChange={(event, op) => {
        setOperator(op);
        valueRef.current = normalizeColumnFilterValue(op, valueRef.current);
        setValue(valueRef.current);
        onOperatorChange?.(event, op);
      }}
      operators={operators}
      showOperatorPicker={showOperatorPicker}
      value={value}
      variant={variant}
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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-container",
    css: filterContainerCss,
    window: targetWindow,
  });

  console.log(`[FilterContainer] current filter ${JSON.stringify(filter)}`);

  const filterContextProps = useFilterContainer({
    filter,
    filterProviderKey,
    onFilterApplied,
    onFilterCleared,
  });
  return (
    <ColumnFilterContext.Provider value={filterContextProps}>
      <div
        {...htmlAttributes}
        className={cx(classBase, className, "vuuScrollable")}
      >
        {children}
      </div>
    </ColumnFilterContext.Provider>
  );
};
