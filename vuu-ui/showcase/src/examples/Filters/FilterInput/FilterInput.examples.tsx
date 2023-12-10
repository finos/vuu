import { NamedDataSourceFilter } from "@finos/vuu-data-types";
import { JsonTable } from "@finos/vuu-datatable";
import { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  addFilter,
  FilterInput,
  FilterSaveOptions,
  filterSubmissionHandler,
  useFilterSuggestionProvider,
} from "@finos/vuu-filters";
import { FilterSubmissionMode } from "@finos/vuu-filters/src/filter-input/useFilterAutoComplete";
import { useFilterConfig } from "@finos/vuu-filters/src/use-filter-config";
import { filterAsQuery, JsonData } from "@finos/vuu-utils";
import { Dropdown, SelectionChangeHandler } from "@salt-ds/lab";
import { Button } from "@salt-ds/core";
import { useCallback, useMemo, useState } from "react";
import { useAutoLoginToVuuServer } from "../../utils/useAutoLoginToVuuServer";
import { getSchema } from "@finos/vuu-data-test";

let displaySequence = 1;

const { columns, table } = getSchema("instruments");

export const DefaultFilterInput = () => {
  const namedFilters = useMemo(() => new Map<string, string>(), []);
  const [filterState, setFilterState] = useState<FilterState>({
    filter: undefined,
    filterQuery: "",
  });
  const suggestionProvider = useFilterSuggestionProvider({
    columns,
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
      <JsonTable
        source={filterState.filter as unknown as JsonData}
        height={400}
      />
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
    columns,
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
DefaultFilterInputWithPersistence.displaySequence = displaySequence++;

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
    columns,
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
      <JsonTable
        source={filterState.filter as unknown as JsonData}
        height={400}
      />
    </>
  );
};
FilterInputTabs.displaySequence = displaySequence++;
