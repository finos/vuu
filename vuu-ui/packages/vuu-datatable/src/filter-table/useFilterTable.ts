import { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import { FilterBarProps } from "@vuu-ui/vuu-filters";
import { useCallback } from "react";
import { FilterTableProps } from "./FilterTable";

export const useFilterTable = ({
  FilterBarProps,
  TableProps: {
    config: { columns },
    dataSource,
  },
}: FilterTableProps) => {
  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      dataSource.filter = filter;
    },
    [dataSource],
  );

  const filterBarProps: FilterBarProps = {
    ...FilterBarProps,
    columnDescriptors: FilterBarProps?.columnDescriptors ?? columns,
    onApplyFilter: handleApplyFilter,
  };

  return {
    filterBarProps,
  };
};
