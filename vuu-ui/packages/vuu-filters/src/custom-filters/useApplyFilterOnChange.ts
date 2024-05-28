import { useCallback, useEffect } from "react";
import {
  ColumnDescriptorsByName,
  Filter,
  FilterState,
} from "@finos/vuu-filter-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { filterAsQuery } from "@finos/vuu-utils";

interface ApplyFilterHookProps {
  activeFilterIndex: FilterState["activeIndices"];
  columnsByName: ColumnDescriptorsByName;
  filters: FilterState["filters"];
  onApplyFilter: (f: DataSourceFilter) => void;
}

export function useApplyFilterOnChange({
  activeFilterIndex,
  columnsByName,
  filters,
  onApplyFilter,
}: ApplyFilterHookProps) {
  const applyFilter = useCallback(
    (filter?: Filter) => {
      const query = filter ? filterAsQuery(filter, { columnsByName }) : "";
      onApplyFilter({ filter: query, filterStruct: filter });
    },
    [columnsByName, onApplyFilter]
  );

  useEffect(() => {
    const activeFilters = activeFilterIndex.map((i) => filters[i]);
    if (activeFilters.length === 0) {
      applyFilter();
    } else if (activeFilters.length === 1) {
      const [filter] = activeFilters;
      applyFilter(filter);
    } else {
      applyFilter({ op: "and", filters: activeFilters });
    }
  }, [activeFilterIndex, applyFilter, filters]);
}
