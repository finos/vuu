import { TypeaheadParams } from "../../../../packages/vuu-protocol-types";
import {
  extractFilter,
  filterAsQuery,
  parseFilter,
} from "@vuu-ui/datagrid-parsers";
import { ParsedInput, ParserProvider } from "@vuu-ui/parsed-input";
import { useCallback, useState } from "react";
import { createSuggestionProvider } from "./filter-suggestion-provider";

import "./ParsedInput.stories.css";

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
  const [namedFilters, setNamedFilters] = useState([]);
  const [queryString, setQueryString] = useState("");

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    const filterQuery = filterAsQuery(filter, namedFilters);
    // console.log(
    //   `extracted filter
    //   ${JSON.stringify(filter)}
    //   %c${filterQuery}
    //   %c${name ? name : ""}
    //   `,
    //   "color:blue;font-weight:bold;",
    //   "color:black"
    // );
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }

    setQueryString(filterQuery);
  };

  const getSuggestions = useCallback(
    (params: TypeaheadParams): Promise<string[]> => {
      const [{ table: tableName }, column] = params;
      return new Promise((resolve) => {
        switch (column) {
          case "currency":
            resolve(["EUR", "GBP", "JPY", "SEK", "USD"]);
            break;
          case "exchange":
            resolve([
              "XAMS/ENA-MAIN",
              "XLON/LSE-SETS",
              "XNGS/NAS-GSM",
              "XNYS/NYS-MAIN",
            ]);
            break;
          case "bbg":
            // prettier-ignore
            resolve(["AAA.LN", "AAA.US","AAA.OQ","AAA.NL","AAA.OE","AAA.MI"]);
            break;
          default:
            resolve([] as string[]);
        }
      });
    },
    []
  );

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: schemaColumns,
        namedFilters,
        getSuggestions,
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
