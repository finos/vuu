import { ComponentAnatomy } from "@heswell/component-anatomy";
import {
  extractFilter,
  filterAsQuery,
  parseFilter,
} from "@vuu-ui/datagrid-parsers";
import {
  ParsedInput,
  ParsedInputFilter,
  ParserProvider,
} from "@vuu-ui/parsed-input";
import { Button, Pill, Pillbox } from "@vuu-ui/ui-controls";
import { addFilter, filterClauses } from "@vuu-ui/utils";
import cx from "classnames";
import { useCallback, useRef, useState } from "react";
import createSuggestionProvider from "./filter-suggestion-provider";

import "./ParsedInput.stories.css";

const columnNames = [
  "bbg",
  "ccy",
  "exchange",
  "price",
  "quantity",
  "status",
  "timestamp",
];
const columns = [
  { name: "bbg", type: "string" },
  { name: "ccy", type: "string" },
  { name: "exchange", type: "string" },
  { name: "price", type: "number" },
  { name: "quantity", type: "number" },
  { name: "status", type: "string" },
  { name: "timestamp", type: "string" },
];

const typeChar = (type) => {
  switch (type) {
    case "number":
      return "n";
    default:
      return "s";
  }
};

let displaySequence = 1;

const annotateWithTypes = (columns) =>
  columns.map(({ name: columnName, type }) => ({
    name: columnName,
    type,
    typedName: Array(columnName.length).fill(typeChar(type)).join(""),
  }));

const typedColumns = annotateWithTypes(columns);

//TODO combine parser and getTokenTypes into a parser
export const ParsedFilterInput = () => {
  const [namedFilters, setNamedFilters] = useState([]);

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    const filterQuery = filterAsQuery(filter, namedFilters);
    console.log(
      `extracted filter 
      ${JSON.stringify(filter)} 
      %c${filterQuery}
      %c${name ? name : ""}
      `,
      "color:blue;font-weight:bold;",
      "color:black"
    );
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: typedColumns,
        columnNames,
        namedFilters,
      })}
    >
      <div style={{ width: 600 }}>
        <ParsedInput onCommit={handleCommit} />
      </div>
    </ParserProvider>
  );
};
ParsedFilterInput.displaySequence = displaySequence++;

export const ParsedFilterInputWithPillbox = () => {
  const [filter, setFilter] = useState();
  const [namedFilters, setNamedFilters] = useState([]);

  const handleCommit = (result) => {
    const { filter: f, name } = extractFilter(result);
    const filterQuery = filterAsQuery(f, namedFilters);
    console.log(
      `extracted filter 
      ${JSON.stringify(f)} 
      %c${filterQuery}
      %c${name ? name : ""}
      `,
      "color:blue;font-weight:bold;",
      "color:black"
    );
    setFilter(addFilter(filter, f, { combineWith: "and" }));
    if (name) {
      setNamedFilters(namedFilters.concat({ name, f }));
    }
  };

  const handleClearAll = () => {
    console.log("clear all");
  };

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: typedColumns,
        columnNames,
        namedFilters,
      })}
    >
      <div style={{ width: 600 }}>
        <ParsedInput onCommit={handleCommit} />
      </div>
      {filter ? (
        <div style={{ width: 600, display: "flex", border: "solid 1px #ccc" }}>
          <Pillbox style={{ width: 600, flex: "1 1 auto" }}>
            {filterClauses(filter).map((clause, i) => (
              <Pill
                key={i}
                prefix={clause.column}
                label={clause.value}
                closeable
                selected
              />
            ))}
          </Pillbox>
          <Button
            className="hwButtonClear"
            style={{ flex: "0 0 28px", height: 28 }}
            onClick={handleClearAll}
          >
            <span className={`hwIconContainer`} data-icon="close-circle" />
          </Button>
        </div>
      ) : null}
    </ParserProvider>
  );
};
ParsedFilterInputWithPillbox.displaySequence = displaySequence++;

export const DefaultParsedInputFilter = () => {
  const [namedFilters, setNamedFilters] = useState([]);

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    const filterQuery = filterAsQuery(filter, namedFilters);
    console.log(
      `extracted filter 
      ${JSON.stringify(filter)} 
      %c${filterQuery}
      %c${name ? name : ""}
      `,
      "color:blue;font-weight:bold;",
      "color:black"
    );
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: typedColumns,
        columnNames,
        namedFilters,
      })}
    >
      <ParsedInputFilter onCommit={handleCommit} />
    </ParserProvider>
  );
};
DefaultParsedInputFilter.displaySequence = displaySequence++;

export const ParsedFilterExpando = () => {
  const expando = useRef(null);
  const input = useRef(null);
  const button = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [namedFilters, setNamedFilters] = useState([]);
  const [filter, setFilter] = useState();

  const handleCommit = (result) => {
    const { filter: f, name } = extractFilter(result);
    const filterQuery = filterAsQuery(f, namedFilters);
    console.log(
      `extracted filter 
      ${JSON.stringify(f)} 
      %c${filterQuery}
      %c${name ? name : ""}
      `,
      "color:blue;font-weight:bold;",
      "color:black"
    );
    setExpanded(false);
    setTimeout(() => {
      button.current.focus();
    }, 100);

    setFilter(addFilter(filter, f, { combineWith: "and" }));
    if (name) {
      setNamedFilters(namedFilters.concat({ name, f }));
    }
  };

  const handleExpand = useCallback(() => {
    setExpanded((val) => !val);
    if (expanded) {
      setExpanded(false);
      button.current.focus();
    } else {
      setExpanded(true);
      setTimeout(() => {
        input.current.focus();
      }, 500);
    }
  }, [expanded]);

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: typedColumns,
        columnNames,
        namedFilters,
      })}
    >
      <div className="expando-container" style={{ width: 600 }}>
        <div className="expando-inner-container">
          <Button
            data-icon="filter"
            onClick={handleExpand}
            ref={button}
            style={{ flex: "0 0 auto" }}
          ></Button>
          <div ref={expando} className={cx("expando", { expanded })}>
            <ParsedInput
              className="expando-input"
              ref={input}
              onCommit={handleCommit}
            />
          </div>
          {filter ? (
            <Pillbox style={{ flex: "1 1 auto" }}>
              {filterClauses(filter).map((clause, i) => (
                <Pill
                  key={i}
                  prefix={clause.column}
                  label={clause.value}
                  closeable
                  selected
                />
              ))}
            </Pillbox>
          ) : null}
        </div>
      </div>
    </ParserProvider>
  );
};
ParsedFilterExpando.displaySequence = displaySequence++;

export const WithVisualiser = () => {
  const handleCommit = (result) => {
    console.log(JSON.stringify(result, null, 2));
  };
  return (
    <ComponentAnatomy style={{ width: "100%" }}>
      <ParserProvider
        parser={parseFilter}
        suggestionProvider={createSuggestionProvider({ columnNames })}
      >
        <div style={{ width: 600 }}>
          <ParsedInput ref={input} onCommit={handleCommit} />
        </div>
      </ParserProvider>
    </ComponentAnatomy>
  );
};
WithVisualiser.displaySequence = displaySequence++;
