import { FormEventHandler, useCallback, useMemo, useState } from "react";
import { TableSearchProps } from "./TableSearch";
import { DataSource } from "@vuu-ui/vuu-data-types";

export interface TableSearchHookProps
  extends Pick<TableSearchProps, "searchColumns"> {
  dataSource: DataSource;
  label?: string;
}

export const useTableSearch = ({
  dataSource,
  searchColumns,
}: TableSearchHookProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
    filter: string;
  }>({ searchText: "", filter: "" });

  const baseFilterPattern = useMemo(
    // TODO make this contains once server supports it
    () =>
      searchColumns.map((col) => `${col} contains "__VALUE__"`).join(" or "),
    [searchColumns],
  );

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      const filter = baseFilterPattern.replaceAll("__VALUE__", value);
      setSearchState({
        searchText: value,
        filter,
      });
      if (dataSource) {
        dataSource.filter = {
          filter,
        };
      }
    },
    [baseFilterPattern, dataSource],
  );

  return {
    dataSource,
    onChange: handleChange,
    searchState,
  };
};
