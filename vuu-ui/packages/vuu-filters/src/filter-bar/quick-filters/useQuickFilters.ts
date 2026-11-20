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
/**
 * Committed quick filter values, keyed by column name.
 */
export type QuickFilterValues = Record<string, QuickFilterValue>;

const NO_VALUES: QuickFilterValues = {};

const sameValue = (v1?: QuickFilterValue, v2?: QuickFilterValue) =>
  v1 === v2 ||
  (v1 !== undefined &&
    v2 !== undefined &&
    v1.op === v2.op &&
    (Array.isArray(v1.value) && Array.isArray(v2.value)
      ? v1.value[0] === v2.value[0] && v1.value[1] === v2.value[1]
      : v1.value === v2.value));

const sameValues = (values1: QuickFilterValues, values2: QuickFilterValues) => {
  const keys = Object.keys(values1);
  return (
    keys.length === Object.keys(values2).length &&
    keys.every((key) => sameValue(values1[key], values2[key]))
  );
};

/**
 * Columns whose committed value differs between the two.
 */
const changedColumns = (
  values1: QuickFilterValues,
  values2: QuickFilterValues,
) =>
  [...new Set([...Object.keys(values1), ...Object.keys(values2)])].filter(
    (name) => !sameValue(values1[name], values2[name]),
  );

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
  | "applyHiddenValues"
  | "availableColumns"
  | "defaultQuickFilterColumns"
  | "onApplyFilter"
  | "onChangeQuickFilterColumns"
  | "onClearFilter"
  | "onQuickFilterChange"
  | "onQuickFilterValuesChange"
  | "quickFilterColumns"
  | "quickFilterValues"
  | "showFind"
>;

export const useQuickFilters = ({
  allowFind = true,
  applyHiddenValues = false,
  availableColumns,
  defaultQuickFilterColumns,
  onApplyFilter,
  onChangeQuickFilterColumns,
  onClearFilter,
  onQuickFilterChange,
  onQuickFilterValuesChange,
  quickFilterColumns: quickFilterColumnsProp,
  quickFilterValues: quickFilterValuesProp,
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

  // the values committed. A controlled map is compared by content, so a
  // host that builds a new map each render does not reapply the filter.
  const [committedState, setUncontrolledCommitted] = useControlled({
    controlled: quickFilterValuesProp,
    default: NO_VALUES,
    name: "QuickFilters",
    state: "quickFilterValues",
  });
  const committedRef = useRef(committedState);
  if (!sameValues(committedRef.current, committedState)) {
    committedRef.current = committedState;
  }
  const committed = committedRef.current;

  // the values shown in the controls. Where a committed value changes, the
  // control shows it, including when it changes from outside.
  const [values, setValues] = useState<QuickFilterValues>(committed);
  const [shownCommitted, setShownCommitted] = useState(committed);
  if (shownCommitted !== committed) {
    const changed = changedColumns(shownCommitted, committed);
    setShownCommitted(committed);
    setValues((current) => {
      const next = { ...current };
      changed.forEach((name) => {
        if (committed[name] === undefined) {
          delete next[name];
        } else {
          next[name] = committed[name];
        }
      });
      return next;
    });
  }

  const commit = useCallback(
    (update: (current: QuickFilterValues) => QuickFilterValues) => {
      const next = update(committedRef.current);
      committedRef.current = next;
      setUncontrolledCommitted(next);
      onQuickFilterValuesChange?.(next);
    },
    [onQuickFilterValuesChange],
  );

  const [searchText, setSearchText] = useState("");
  const [searchFilterText, setSearchFilterText] = useState("");
  const searchTimer = useRef<number | undefined>(undefined);

  const handlersRef = useRef({
    onApplyFilter,
    onClearFilter,
    onQuickFilterChange,
  });
  handlersRef.current = { onApplyFilter, onClearFilter, onQuickFilterChange };

  // apply what is committed, for the columns shown, or for every column
  // if applyHiddenValues
  const appliedColumns = useMemo(
    () =>
      (applyHiddenValues ? availableColumns : filterColumns).filter(
        ({ name }) => committed[name] !== undefined,
      ),
    [applyHiddenValues, availableColumns, committed, filterColumns],
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
      commit((current) => {
        const { [column.name]: _, ...rest } = current;
        return isEmptyValue(value)
          ? rest
          : { ...rest, [column.name]: { op: filterOp, value } };
      });
    },
    [commit],
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

  const clearColumn = useCallback(
    (column: ColumnDescriptor) => {
      const removeColumn = (current: QuickFilterValues) => {
        const { [column.name]: _, ...rest } = current;
        return rest;
      };
      setValues(removeColumn);
      commit(removeColumn);
    },
    [commit],
  );

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
