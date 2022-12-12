import React, { useCallback, useEffect, useState } from "react";
import {
  Filter,
  FilterInput,
  FilterToolbar,
  updateFilter,
} from "@vuu-ui/vuu-filters";

import { useSuggestionProvider } from "./useSuggestionProvider";
import {
  authenticate as vuuAuthenticate,
  connectToServer,
} from "@vuu-ui/vuu-data";
import {} from "@vuu-ui/vuu-utils";

// import "./ParsedInput.stories.css";

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
  const [filter, setFilter] = useState<Filter>();
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const suggestionProvider = useSuggestionProvider({
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
    (filter: Filter | undefined, filterQuery: string, filterName?: string) => {
      setFilter(filter);
      setFilterQuery(filterQuery);
      setFilterName(filterName);
    },
    []
  );

  return (
    <>
      <FilterInput
        onSubmitFilter={handleSubmitFilter}
        suggestionProvider={suggestionProvider}
      />
      <br />
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
DefaultFilterInput.displaySequence = displaySequence++;

export const FilterInputWithToolbar = () => {
  const [filter, setFilter] = useState<Filter>();
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const suggestionProvider = useSuggestionProvider({
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
      setFilterName(filterName);
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
      >
        {/*
        <ToggleButton
          className="vuuToggleButton"
          onToggle={handleToggleTestThree}
          toggled={testThreeEnabled}
        >
          Test Three
        </ToggleButton>
        <Pill
          className="vuuFilterPill"
          label="Test Four"
          variant="selectable"
        ></Pill> */}
      </FilterToolbar>

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
