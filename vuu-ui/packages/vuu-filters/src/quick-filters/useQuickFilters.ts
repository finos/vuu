import type { Filter } from "@finos/vuu-filter-types";
import { Commithandler } from "@finos/vuu-ui-controls";
import { filterAsQuery, queryClosest } from "@finos/vuu-utils";
import { VuuRowDataItemType } from "packages/vuu-protocol-types";
import { ChangeEventHandler, RefCallback, useCallback, useRef } from "react";
import { DataSourceFilter } from "packages/vuu-data-types";
import { QuickFilterProps } from "./QuickFilters";
import { ColumnDescriptor } from "packages/vuu-table-types";

export type QuickFilterHookProps = Pick<
  QuickFilterProps,
  "availableColumns" | "onApplyFilter"
>;

type QuickFilterValues = Record<string, VuuRowDataItemType>;

const createFilterClause = (
  [identifier, value]: [string, VuuRowDataItemType],
  availableColumns?: ColumnDescriptor[]
): Filter => {
  if (identifier === "find") {
    if (availableColumns) {
      const targetColumns = availableColumns.filter(
        ({ serverDataType }) => serverDataType === "string"
      );
      if (targetColumns.length) {
        return {
          op: "or",
          filters: targetColumns.map((column) =>
            createFilterClause([column.name, value])
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
  availableColumns: ColumnDescriptor[]
): Filter => {
  const entries = Object.entries(quickFilters);
  if (entries.length === 1) {
    return createFilterClause(entries[0], availableColumns);
  } else if (entries.length > 1) {
    return {
      op: "and",
      filters: entries.map(
        (entry) => createFilterClause(entry, availableColumns),
        availableColumns
      ),
    };
  } else {
    throw Error("What no filter");
  }
};

const buildFilter = (
  quickFilters: QuickFilterValues,
  availableColumns: ColumnDescriptor[]
): DataSourceFilter => {
  const filterStruct = buildFilterStruct(quickFilters, availableColumns);
  return {
    filter: filterAsQuery(filterStruct),
    filterStruct,
  };
};

export const useQuickFilters = ({
  availableColumns,
  onApplyFilter,
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
    []
  );

  const handleCommit = useCallback<Commithandler>(
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
    [availableColumns, onApplyFilter]
  );

  return {
    onChange: handleChange,
    onCommit: handleCommit,
    rootRef,
  };
};
