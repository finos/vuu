import { useControlled } from "@salt-ds/core";
import type {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
  ColumnFilterOp,
  ColumnFilterValue,
  Filter,
} from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { isBetweenOperator } from "@vuu-ui/vuu-utils";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterAggregator } from "../../FilterAggregator";
import type { QuickFilterProps } from "./QuickFilters";

const SEARCH_DEBOUNCE_MS = 300;
const NO_COLUMNS: string[] = [];

export type QuickFilterValue = {
  op: ColumnFilterOp;
  value: ColumnFilterValue;
};
type QuickFilterValues = Record<string, QuickFilterValue>;

const isEmptyValue = (value: ColumnFilterValue) =>
  Array.isArray(value)
    ? value[0] === "" && value[1] === ""
    : value === undefined || `${value}`.trim() === "";

const emptyValue = (op: ColumnFilterOp): ColumnFilterValue =>
  isBetweenOperator(op) ? ["", ""] : "";

/**
 * The search control matches text containing what is typed, in any of the
 * search columns.
 */
const getSearchFilter = (
  text: string,
  searchColumns: readonly ColumnDescriptor[],
): Filter | undefined => {
  if (text === "" || searchColumns.length === 0) {
    return undefined;
  } else if (searchColumns.length === 1) {
    return { column: searchColumns[0].name, op: "contains", value: text };
  } else {
    return {
      op: "or",
      filters: searchColumns.map(({ name }) => ({
        column: name,
        op: "contains",
        value: text,
      })),
    };
  }
};

export type QuickFilterHookProps = Pick<
  QuickFilterProps,
  | "allowFind"
  | "availableColumns"
  | "defaultQuickFilterColumns"
  | "onApplyFilter"
  | "onChangeQuickFilterColumns"
  | "onClearFilter"
  | "onQuickFilterChange"
  | "quickFilterColumns"
  | "showFind"
>;

export const useQuickFilters = ({
  allowFind = true,
  availableColumns,
  defaultQuickFilterColumns,
  onApplyFilter,
  onChangeQuickFilterColumns,
  onClearFilter,
  onQuickFilterChange,
  quickFilterColumns: quickFilterColumnsProp,
  showFind,
}: QuickFilterHookProps) => {
  // what Reset restores: the configured default, else the columns first shown
  const [resetColumns] = useState(
    defaultQuickFilterColumns ?? quickFilterColumnsProp ?? NO_COLUMNS,
  );
  const [quickFilterColumns, setQuickFilterColumns] = useControlled({
    controlled: quickFilterColumnsProp,
    default: defaultQuickFilterColumns ?? NO_COLUMNS,
    name: "QuickFilters",
    state: "quickFilterColumns",
  });

  const filterColumns = useMemo(
    () =>
      quickFilterColumns
        .map((name) => availableColumns.find((col) => col.name === name))
        .filter((col): col is ColumnDescriptor => col !== undefined),
    [availableColumns, quickFilterColumns],
  );

  const searchColumns = useMemo(() => {
    if (!allowFind && !showFind) {
      return [];
    } else if (Array.isArray(showFind)) {
      return availableColumns.filter(({ name }) => showFind.includes(name));
    } else {
      return availableColumns.filter(
        ({ serverDataType }) => serverDataType === "string",
      );
    }
  }, [allowFind, availableColumns, showFind]);

  // the values shown in the controls, and the values committed
  const [values, setValues] = useState<QuickFilterValues>({});
  const [committed, setCommitted] = useState<QuickFilterValues>({});
  const [searchText, setSearchText] = useState("");
  const [searchFilterText, setSearchFilterText] = useState("");
  const searchTimer = useRef<number | undefined>(undefined);

  const handlersRef = useRef({
    onApplyFilter,
    onClearFilter,
    onQuickFilterChange,
  });
  handlersRef.current = { onApplyFilter, onClearFilter, onQuickFilterChange };

  // apply what is committed, for the columns shown
  const appliedColumns = useMemo(
    () => filterColumns.filter(({ name }) => committed[name] !== undefined),
    [committed, filterColumns],
  );
  useEffect(() => {
    const aggregator = new FilterAggregator();
    appliedColumns.forEach((column) => {
      const { op, value } = committed[column.name];
      aggregator.add(column, value, op === "in" ? "=" : op);
    });
    const searchFilter = getSearchFilter(searchFilterText, searchColumns);
    const filters = [aggregator.filter, searchFilter].filter(
      (f): f is Filter => f !== undefined,
    );
    const filter: Filter | undefined =
      filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0]
          : { op: "and", filters };
    const count = appliedColumns.length + (searchFilter ? 1 : 0);
    const { onApplyFilter, onClearFilter, onQuickFilterChange } =
      handlersRef.current;
    onQuickFilterChange?.(filter, count);
    if (filter) {
      onApplyFilter?.(filter);
    } else {
      onClearFilter?.();
    }
  }, [appliedColumns, committed, searchColumns, searchFilterText]);

  const getValue = useCallback(
    (column: ColumnDescriptor): QuickFilterValue | undefined =>
      values[column.name],
    [values],
  );

  const isSet = useCallback(
    (column: ColumnDescriptor) => committed[column.name] !== undefined,
    [committed],
  );

  const updateValue = useCallback(
    (
      column: ColumnDescriptor,
      update: (v?: QuickFilterValue) => QuickFilterValue,
    ) =>
      setValues((current) => ({
        ...current,
        [column.name]: update(current[column.name]),
      })),
    [],
  );

  const handleChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      updateValue(column, (current) => ({
        op,
        value: Array.isArray(current?.value)
          ? [`${value}`, current.value[1]]
          : value,
      }));
    },
    [updateValue],
  );

  const handleRangeChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      updateValue(column, (current) => ({
        op,
        value: Array.isArray(current?.value)
          ? [current.value[0], `${value}`]
          : ["", `${value}`],
      }));
    },
    [updateValue],
  );

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      const filterOp = op as ColumnFilterOp;
      setValues((current) => ({
        ...current,
        [column.name]: { op: filterOp, value },
      }));
      setCommitted((current) => {
        const { [column.name]: _, ...rest } = current;
        return isEmptyValue(value)
          ? rest
          : { ...rest, [column.name]: { op: filterOp, value } };
      });
    },
    [],
  );

  const handleOperatorChange = useCallback(
    (column: ColumnDescriptor, _e: SyntheticEvent, op: ColumnFilterOp) => {
      updateValue(column, (current) => ({
        op,
        value: current?.value ?? emptyValue(op),
      }));
    },
    [updateValue],
  );

  const clearColumn = useCallback((column: ColumnDescriptor) => {
    const removeColumn = (current: QuickFilterValues) => {
      const { [column.name]: _, ...rest } = current;
      return rest;
    };
    setValues(removeColumn);
    setCommitted(removeColumn);
  }, []);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchText(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setSearchFilterText(value.trim());
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    window.clearTimeout(searchTimer.current);
    setSearchText("");
    setSearchFilterText("");
  }, []);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const changeColumns = useCallback(
    (columns: string[]) => {
      setQuickFilterColumns(columns);
      onChangeQuickFilterColumns?.(columns);
    },
    [onChangeQuickFilterColumns, setQuickFilterColumns],
  );

  const resetColumnsToDefault = useCallback(() => {
    changeColumns(resetColumns);
  }, [changeColumns, resetColumns]);

  return {
    clearColumn,
    clearSearch,
    filterColumns,
    getValue,
    isSet,
    onChange: handleChange,
    onChangeColumns: changeColumns,
    onCommit: handleCommit,
    onOperatorChange: handleOperatorChange,
    onRangeChange: handleRangeChange,
    onResetColumns: resetColumnsToDefault,
    resetColumns,
    onSearchChange: handleSearchChange,
    searchColumns,
    searchText,
  };
};
