import { FormEventHandler, useCallback, useMemo, useState } from "react";
import { InstrumentSearchProps } from "./InstrumentSearch";

export interface InstrumentSearchHookProps
  extends Pick<InstrumentSearchProps, "dataSource" | "searchColumns"> {
  label?: string;
}

export const useInstrumentSearch = ({
  dataSource,
  searchColumns = ["description"],
}: InstrumentSearchHookProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
    filter: string;
  }>({ searchText: "", filter: "" });

  const baseFilterPattern = useMemo(
    // TODO make this contains once server supports it
    () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
    [searchColumns]
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
    [baseFilterPattern, dataSource]
  );

  return {
    dataSource,
    onChange: handleChange,
    searchState,
  };
};
