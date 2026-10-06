import { FilterBarProps } from "@vuu-ui/vuu-filters";
import { useCallback, useMemo } from "react";
import { getColumnsByName } from "@vuu-ui/vuu-utils";
import { FilterTableProps } from "./FilterTable";
import { FilterHandler } from "@vuu-ui/vuu-filter-types";

export const useFilterTable = ({
  FilterBarProps,
  TableProps: {
    config: { columns },
    dataSource,
  },
}: FilterTableProps) => {
  const columnsByName = useMemo(() => getColumnsByName(columns), [columns]);
  const handleApplyFilter = useCallback<FilterHandler>(
    (filter) => {
      dataSource.setFilter?.(filter, { columnsByName });
    },
    [columnsByName, dataSource],
  );

  const handleClearFilter = useCallback(() => {
    dataSource.clearFilter?.();
  }, [dataSource]);

  const filterBarProps: FilterBarProps = {
    ...FilterBarProps,
    columnDescriptors: FilterBarProps?.columnDescriptors ?? columns,
    onApplyFilter: handleApplyFilter,
    onClearFilter: handleClearFilter,
  };

  return {
    filterBarProps,
  };
};
