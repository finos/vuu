import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { MultiSelectionHandler } from "@vuu-ui/vuu-ui-controls";
import {
  CommitHandler,
  isNumericColumn,
  queryClosest,
} from "@vuu-ui/vuu-utils";
import {
  ChangeEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { QuickFilterProps } from "./QuickFilters";

type QuickFilterValues = Record<string, string>;

const findColumn = (columns: ColumnDescriptor[], name: string) => {
  const column = columns?.find((col) => col.name === name);
  if (column) {
    return column;
  } else {
    throw Error(`column not found ${name}`);
  }
};

const asNumeric = (value: string, column: ColumnDescriptor): number => {
  switch (column.serverDataType) {
    case "int":
    case "long": {
      const numericValue = parseInt(value, 10);
      if (isNaN(numericValue)) {
        throw Error(`invalid value ${value} is not integer`);
      } else {
        return numericValue;
      }
    }
    case "double": {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        throw Error(`invalid value ${value} is not decimal`);
      } else {
        return numericValue;
      }
    }
    default:
      throw Error(
        `DataType of column ${column.name}, ${column.serverDataType} is not numeric`,
      );
  }
};

const createFilterClause = (
  [identifier, value]: [string, string],
  availableColumns: ColumnDescriptor[],
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
            createFilterClause([column.name, value], availableColumns),
          ),
        };
      } else {
        throw Error(`value ${value} is not valid for any of available columns`);
      }
    } else {
      throw Error("columns must be provided for find operation");
    }
  } else {
    const column = findColumn(availableColumns, identifier);
    if (isNumericColumn(column)) {
      const numericValue = asNumeric(value, column);
      return {
        column: identifier,
        op: "=",
        value: numericValue,
      };
    } else {
      return {
        column: identifier,
        op: "contains",
        value,
      };
    }
  }
};

const buildFilter = (
  quickFilters: QuickFilterValues,
  availableColumns: ColumnDescriptor[],
): Filter | undefined => {
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
  }
};

export type QuickFilterHookProps = Pick<
  QuickFilterProps,
  | "availableColumns"
  | "onApplyFilter"
  | "onClearFilter"
  | "onChangeQuickFilterColumns"
  | "quickFilterColumns"
>;

export const useQuickFilters = ({
  availableColumns,
  onApplyFilter,
  onClearFilter,
  onChangeQuickFilterColumns,
}: QuickFilterProps) => {
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

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (e, value) => {
      const field = queryClosest(e.target, "[data-field]");
      const column = field?.dataset.field;
      if (column) {
        if (
          value === undefined ||
          (typeof value === "string" && value.trim() === "")
        ) {
          if (filters.current[column] === undefined) {
            return;
          }
          delete filters.current[column];
        } else if (typeof value === "string" && value.trim() !== "") {
          filters.current[column] = value;
        }

        const filter = buildFilter(filters.current, availableColumns);
        if (filter) {
          onApplyFilter?.(filter);
        } else {
          onClearFilter();
        }
      }
    },
    [availableColumns, onApplyFilter, onClearFilter],
  );

  const handleColumnsSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, newSelected) => {
      onChangeQuickFilterColumns?.(newSelected);
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
    rootRef,
  };
};
