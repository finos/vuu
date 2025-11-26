import { FilterBarProps } from "@vuu-ui/vuu-filters";
import { useCallback } from "react";
import { FilterTableProps } from "./FilterTable";
import { FilterHandler } from "@vuu-ui/vuu-filter-types";

export const useFilterTable = ({
  FilterBarProps,
  TableProps: {
    config: { columns },
    dataSource,
  },
}: FilterTableProps) => {
  const handleApplyFilter = useCallback<FilterHandler>(
    (filter) => {
      dataSource.setFilter?.(filter);
    },
    [dataSource],
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
