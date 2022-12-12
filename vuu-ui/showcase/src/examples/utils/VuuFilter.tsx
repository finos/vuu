import { SchemaColumn, useViewserver } from "@vuu-ui/vuu-data";
import {
  extractFilter,
  filterAsQuery,
  NamedFilter,
  parseFilter,
} from "@vuu-ui/datagrid-parsers";
import { ParsedInput, ParserProvider } from "@vuu-ui/parsed-input";
import { Filter } from "@vuu-ui/vuu-filters";
import { useState } from "react";
import { createSuggestionProvider } from "./vuu-filter-suggestion-provider";

export const VuuFilter = ({ columns }: { columns: SchemaColumn[] }) => {
  const [namedFilters, setNamedFilters] = useState<NamedFilter[]>([]);
  const { getTypeaheadSuggestions } = useViewserver();

  const handleCommit = (result: Filter) => {
    const { filter, name } = extractFilter(result);
    // const filterQuery = filterAsQuery(filter, namedFilters);
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
  };

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns,
        namedFilters,
        getSuggestions: getTypeaheadSuggestions,
        table: { table: "instruments", module: "SIMUL" },
      })}
    >
      <div style={{ width: 600 }}>
        <ParsedInput onCommit={handleCommit} />
      </div>
    </ParserProvider>
  );
};
