import type { DataSourceFilter } from "@finos/vuu-data-types";
import type { Filter } from "@finos/vuu-filter-types";
import type { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { CommitHandler, MultiSelectionHandler } from "@finos/vuu-ui-controls";
import { filterAsQuery, queryClosest } from "@finos/vuu-utils";
import {
  ChangeEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { QuickFilterProps } from "./QuickFilters";

type QuickFilterValues = Record<string, VuuRowDataItemType>;

const createFilterClause = (
  [identifier, value]: [string, VuuRowDataItemType],
  availableColumns?: ColumnDescriptor[],
): Filter => {
  if (identifier === "find") {
    if (availableColumns) {
      const targetColumns = availableColumns.filter(
        ({ serverDataType }) => serverDataType === "string",
      );
      if (targetColumns.length) {
        return {
          op: "or",
          filters: targetColumns.map((column) =>
            createFilterClause([column.name, value]),
          ),
        };
      } else {
        throw Error(`value ${value} is not valid for any of availanle columns`);
      }
    } else {
      throw Error("columns must be provided for find operation");
    }
  } else {
    return {
      column: identifier,
      op: "contains",
      value,
    };
  }
};

const buildFilterStruct = (
  quickFilters: QuickFilterValues,
  availableColumns: ColumnDescriptor[],
): Filter => {
  const entries = Object.entries(quickFilters);
  if (entries.length === 1) {
    return createFilterClause(entries[0], availableColumns);
  } else if (entries.length > 1) {
    return {
      op: "and",
      filters: entries.map(
        (entry) => createFilterClause(entry, availableColumns),
        availableColumns,
      ),
    };
  } else {
    throw Error("What no filter");
  }
};

const buildFilter = (
  quickFilters: QuickFilterValues,
  availableColumns: ColumnDescriptor[],
): DataSourceFilter => {
  const filterStruct = buildFilterStruct(quickFilters, availableColumns);
  return {
    filter: filterAsQuery(filterStruct),
    filterStruct,
  };
};

export type QuickFilterHookProps = Pick<
  QuickFilterProps,
  | "availableColumns"
  | "onApplyFilter"
  | "onChangeQuickFilterColumns"
  | "quickFilterColumns"
>;

export const useQuickFilters = ({
  availableColumns,
  onApplyFilter,
  onChangeQuickFilterColumns,
  quickFilterColumns = [],
}: QuickFilterProps) => {
  //TODO make controlled
  const [quickFilters, setQuickFilters] = useState(quickFilterColumns);
  const filters = useRef<QuickFilterValues>({});
  const rootRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    if (el) {
      const firstInput = el.querySelector("input");
      firstInput?.focus();
    }
  }, []);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      console.log(`onChange ${e.target.value}`);
    },
    [],
  );

  const handleCommit = useCallback<CommitHandler>(
    (e, value) => {
      if (value.trim() !== "") {
        const field = queryClosest(e.target, "[data-field]");
        const column = field?.dataset.field;
        if (column) {
          filters.current[column] = value;
          onApplyFilter?.(buildFilter(filters.current, availableColumns));
        }
      }
    },
    [availableColumns, onApplyFilter],
  );

  const handleColumnsSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, newSelected) => {
      onChangeQuickFilterColumns?.(newSelected);
      setQuickFilters(newSelected);
    },
    [onChangeQuickFilterColumns],
  );

  const availableColumnNames = useMemo(
    () => availableColumns.map((col) => col.name),
    [availableColumns],
  );

  return {
    availableColumnNames,
    onChange: handleChange,
    onColumnsSelectionChange: handleColumnsSelectionChange,
    onCommit: handleCommit,
    quickFilters,
    rootRef,
  };
};
