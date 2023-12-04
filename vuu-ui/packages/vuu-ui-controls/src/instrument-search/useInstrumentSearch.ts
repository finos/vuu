import { RemoteDataSource } from "@finos/vuu-data";
import { getVuuTableSchema } from "@finos/vuu-data-react";
import { FormEventHandler, useCallback, useMemo, useState } from "react";
import { InstrumentSearchProps } from "./InstrumentSearch";

export interface InstrumentSearchHookProps
  extends Pick<
    InstrumentSearchProps,
    "dataSource" | "searchColumns" | "table"
  > {
  label?: string;
}

export const useInstrumentSearch = ({
  dataSource: dataSourceProp,
  searchColumns = ["description"],
  table,
}: InstrumentSearchHookProps) => {
  const [dataSource, setDataSource] = useState(dataSourceProp);
  const [searchState, setSearchState] = useState<{
    searchText: string;
    filter: string;
  }>({ searchText: "", filter: "" });

  const baseFilterPattern = useMemo(
    // TODO make this contains once server supports it
    () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
    [searchColumns]
  );

  useMemo(() => {
    if (dataSourceProp === undefined) {
      if (table) {
        getVuuTableSchema(table).then((tableSchema) => {
          setDataSource(
            new RemoteDataSource({
              table: tableSchema.table,
              columns: tableSchema.columns.map((col) => col.name),
            })
          );
        });
      } else {
        throw Error(
          `useInstrumentSearch, if dataSource ismnot provided as prop, Vuu table must be provided`
        );
      }
    }
  }, [dataSourceProp, table]);

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
