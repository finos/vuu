import {
  authenticate as vuuAuthenticate,
  connectToServer,
  useViewserver,
} from "@vuu-ui/vuu-data";
import {
  extractFilter,
  filterAsQuery,
  NamedFilter,
  parseFilter,
} from "@vuu-ui/datagrid-parsers";
import { ParsedInput, ParserProvider } from "@vuu-ui/parsed-input";
import { Filter } from "@vuu-ui/vuu-filters";
import { useEffect, useState } from "react";
import { createSuggestionProvider } from "./vuu-filter-suggestion-provider";

// import './ParsedInput.stories.css';

const schemaColumns = [
  { name: "bbg", serverDataType: "string" } as const,
  { name: "description", serverDataType: "string" } as const,
  { name: "currency", serverDataType: "string" } as const,
  { name: "exchange", serverDataType: "string" } as const,
  { name: "lotSize", serverDataType: "int" } as const,
  { name: "isin", serverDataType: "string" } as const,
  { name: "ric", serverDataType: "string" } as const,
];

let displaySequence = 1;

//TODO combine parser and getTokenTypes into a parser
export const ParsedFilterInput = () => {
  const [namedFilters, setNamedFilters] = useState<NamedFilter[]>([]);
  const [queryString, setQueryString] = useState("");

  const { getTypeaheadSuggestions } = useViewserver();

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const handleCommit = (result: Filter) => {
    const { filter, name } = extractFilter(result);
    const filterQuery = filterAsQuery(filter, namedFilters);
    // console.log(
    //   `extracted filter
    //   %c${JSON.stringify(filter)}
    //   %c${filterQuery}
    //   %c${name ? name : ""}
    //   `,
    //   "color:blue;font-weight:bold;",
    //   "color:green; font-weight: bold;",
    //   "color:red; font-weight: bold;"
    // );
    if (name) {
      const namedFilter = { name, filter } as NamedFilter;
      setNamedFilters(namedFilters.concat(namedFilter));
    }
    setQueryString(filterQuery);
  };

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: schemaColumns,
        namedFilters,
        getSuggestions: getTypeaheadSuggestions,
        table: { table: "instruments", module: "SIMUL" },
      })}
    >
      <div style={{ width: 600 }}>
        <ParsedInput onCommit={handleCommit} />
      </div>
      <br />
      <div>{queryString}</div>
    </ParserProvider>
  );
};
ParsedFilterInput.displaySequence = displaySequence++;
