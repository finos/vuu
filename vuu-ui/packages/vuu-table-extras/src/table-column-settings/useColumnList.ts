import { FormEventHandler, useCallback, useRef, useState } from "react";
import { ColumnItem } from "./useTableSettings";

export interface ColumnSearchProps {
  columnItems: ColumnItem[];
}

export const useColumnList = ({ columnItems }: ColumnSearchProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
  }>({ searchText: "" });

  const visibleColumnsRef = useRef<ColumnItem[] | undefined>(undefined);

  const handleChange = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setSearchState({
      searchText: value,
    });
  }, []);

  return {
    onChange: handleChange,
    searchState,
    visibleColumnItems: visibleColumnsRef.current ?? columnItems,
  };
};
