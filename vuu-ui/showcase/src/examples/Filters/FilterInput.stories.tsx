import { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  addFilter,
  filterAsQuery,
  FilterInput,
  FilterSaveOptions,
  filterSubmissionHandler,
  FilterToolbar,
  updateFilter,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { useCallback, useMemo, useState } from "react";
import { JsonTable } from "@finos/vuu-datatable";
import { useAutoLoginToVuuServer } from "../utils/useAutoLoginToVuuServer";

import {} from "@finos/vuu-utils";
import { FilterSubmissionMode } from "@finos/vuu-filters/src/filter-input/useFilterAutoComplete";
import { Button } from "@salt-ds/core";
import { useFilterConfig } from "@finos/vuu-filters/src/use-filter-config";
import { Dropdown, SelectionChangeHandler } from "@heswell/salt-lab";
import { NamedDataSourceFilter } from "@finos/vuu-data-types";

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

  useAutoLoginToVuuServer();

  const handleSubmitFilter = useCallback(
    (
      newFilter: Filter | undefined,
      filterQuery: string,
      mode: FilterSubmissionMode = "replace",
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
      <JsonTable source={filterState.filter} height={400} />
    </>
  );
};
DefaultFilterInput.displaySequence = displaySequence++;

export const DefaultFilterInputWithPersistence = () => {
  const user = { username: "test-user", token: "test-token" };
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
  const { allFilters, saveFilter } = useFilterConfig({
    user,
    saveLocation: "local",
  });

  useAutoLoginToVuuServer();

  const handleSubmitFilter: filterSubmissionHandler = useCallback(
    (
      newFilter,
      filterQuery,
      mode: FilterSubmissionMode = "replace",
      filterName
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

  const onClick = () =>
    saveFilter({
      name: filterState.filterName,
      filter: filterState.filterQuery,
      filterStruct: filterState.filter,
    });

  const onSelectionChange: SelectionChangeHandler<NamedDataSourceFilter> = (
    _e,
    selected
  ) => {
    if (!selected) return;
    setFilterState({
      filter: selected.filterStruct,
      filterQuery: selected.filter,
      filterName: selected.name,
    });
  };

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
      <p>
        {`Active filter: ${filterState.filterQuery} ${
          filterState.filterName ? "as" : ""
        } ${filterState.filterName}`}
      </p>
      <Button onClick={onClick}>Save current filter</Button>
      <br />
      <br />
      <p>Use the dropdown below to select a previously saved filter</p>
      <Dropdown<NamedDataSourceFilter>
        source={allFilters}
        onSelectionChange={onSelectionChange}
        itemToString={(filter) => filter.name || "Default name"}
      />
    </>
  );
};
DefaultFilterInput.displaySequence = displaySequence++;

export const FilterInputTabs = () => {
  const saveOptions = useMemo<FilterSaveOptions>(
    () => ({ allowReplace: true, allowSaveAsTab: true }),
    []
  );

  const namedFilters = useMemo(() => new Map<string, string>(), []);
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });
  const suggestionProvider = useFilterSuggestionProvider({
    columns: schemaColumns,
    namedFilters,
    saveOptions,
    table,
  });

  useAutoLoginToVuuServer();

  const handleSubmitFilter = useCallback(
    (
      newFilter: Filter | undefined,
      filterQuery: string,
      mode: FilterSubmissionMode = "replace",
      filterName?: string
    ) => {
      if (mode === "tab") {
        alert("create a new tab");
      } else {
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
      <JsonTable source={filterState.filter} height={400} />
    </>
  );
};
FilterInputTabs.displaySequence = displaySequence++;

export const FilterInputWithToolbar = () => {
  const [filter, setFilter] = useState<Filter>();
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const suggestionProvider = useFilterSuggestionProvider({
    columns: schemaColumns,
    table,
  });

  useAutoLoginToVuuServer();

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
    </>
  );
};
FilterInputWithToolbar.displaySequence = displaySequence++;
