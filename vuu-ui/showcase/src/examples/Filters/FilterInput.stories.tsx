import { Filter } from "@finos/vuu-filter-types";
import {
  addFilter,
  filterAsQuery,
  FilterInput,
  FilterToolbar,
  updateFilter,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
} from "@finos/vuu-data";
import {} from "@finos/vuu-utils";

let displaySequence = 1;

const table = { module: "SIMUL", table: "instruments" };

const schemaColumns = [
  { name: "bbg", serverDataType: "string" } as const,
  { name: "description", serverDataType: "string" } as const,
  { name: "currency", serverDataType: "string" } as const,
  { name: "exchange", serverDataType: "string" } as const,
  { name: "lotSize", serverDataType: "int" } as const,
  { name: "isin", serverDataType: "string" } as const,
  { name: "ric", serverDataType: "string" } as const,
];

export const DefaultFilterInput = () => {
  type FilterState = {
    filter: Filter | undefined;
    filterQuery: string;
    filterName?: string;
  };

  const namedFilters = useMemo(() => new Map<string, string>(), []);
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });
  const suggestionProvider = useFilterSuggestionProvider({
    columns: schemaColumns,
    namedFilters,
    table,
  });

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const handleSubmitFilter = useCallback(
    (
      newFilter: Filter | undefined,
      filterQuery: string,
      mode: "and" | "or" | "replace" = "replace",
      filterName?: string
    ) => {
      let newFilterState: FilterState;
      if (newFilter && mode === "and") {
        const fullFilter = addFilter(filterState.filter, newFilter) as Filter;
        newFilterState = {
          filter: fullFilter,
          filterQuery: filterAsQuery(fullFilter),
          filterName,
        };
      } else {
        newFilterState = {
          filter: newFilter,
          filterQuery,
          filterName,
        };
      }

      setFilterState(newFilterState);
      if (filterName && newFilterState.filter) {
        namedFilters.set(filterName, newFilterState.filterQuery);
      }
    },
    [filterState.filter, namedFilters]
  );

  return (
    <>
      <FilterInput
        existingFilter={filterState.filter}
        namedFilters={namedFilters}
        onSubmitFilter={handleSubmitFilter}
        suggestionProvider={suggestionProvider}
      />
      <br />
      <br />
      <div>{filterState.filterQuery}</div>
      <br />
      <div>{filterState.filterName}</div>
      <br />
      <br />
      <div>{JSON.stringify(filterState.filter, null, 2)}</div>
    </>
  );
};
DefaultFilterInput.displaySequence = displaySequence++;

export const FilterInputWithToolbar = () => {
  const [filter, setFilter] = useState<Filter>();
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const suggestionProvider = useFilterSuggestionProvider({
    columns: schemaColumns,
    table,
  });

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const handleSubmitFilter = useCallback(
    (
      filter: Filter | undefined,
      filterQuery: string,
      filterName?: string,
      mode = "add"
    ) => {
      console.log(`setFilter ${JSON.stringify(filter)}`);
      setFilter((existingFilter) => updateFilter(existingFilter, filter, mode));
      setFilterQuery(filterQuery);
      setFilterName(filterName ?? "");
    },
    []
  );

  return (
    <>
      <FilterInput
        existingFilter={filter}
        onSubmitFilter={handleSubmitFilter}
        suggestionProvider={suggestionProvider}
      />
      <br />
      <FilterToolbar
        id="toolbar-default"
        filter={filter}
        suggestionProvider={suggestionProvider}
      />

      <br />
      <div>{filterQuery}</div>
      <br />
      <div>{filterName}</div>
      <br />
      <br />
      <div>{JSON.stringify(filter)}</div>
    </>
  );
};
FilterInputWithToolbar.displaySequence = displaySequence++;
