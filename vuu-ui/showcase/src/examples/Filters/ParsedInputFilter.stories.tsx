import React, { useCallback, useEffect, useState } from "react";
import { ParsedInput } from "@finos/vuu-filters";
import { useSuggestionProvider } from "./useSuggestionProvider";
import {
  authenticate as vuuAuthenticate,
  connectToServer,
} from "@finos/vuu-data";
import { Filter } from "@finos/vuu-utils";

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

//TODO combine parser and getTokenTypes into a parser
export const ParsedFilterInput = () => {
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
      <ParsedInput
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
ParsedFilterInput.displaySequence = displaySequence++;
