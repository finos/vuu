import React, { useRef, useState } from 'react';
import { ParsedInput, ParserProvider, SuggestionList } from '@vuu-ui/parsed-input';
import { parseFilter, extractFilter, filterAsQuery } from '@vuu-ui/datagrid-parsers';
import { addFilter, filterClauses } from '@vuu-ui/utils';
import { Button, Pill, Pillbox } from '@vuu-ui/ui-controls';
import { ComponentAnatomy } from '@heswell/component-anatomy';
import createSuggestionProvider from './filter-suggestion-provider';

import '@vuu-ui/parsed-input/index.css';
import './ParsedInput.stories.css';

const story = {
  title: 'Antlr/ParsedInput',
  component: ParsedInput
};

export default story;

const columnNames = ['bbg', 'ccy', 'exchange', 'price', 'quantity', 'status', 'timestamp'];
const columns = [
  { name: 'bbg', type: 'string' },
  { name: 'ccy', type: 'string' },
  { name: 'exchange', type: 'string' },
  { name: 'price', type: 'number' },
  { name: 'quantity', type: 'number' },
  { name: 'status', type: 'string' },
  { name: 'timestamp', type: 'string' }
];

const typeChar = (type) => {
  switch (type) {
    case 'number':
      return 'n';
    default:
      return 's';
  }
};

const annotateWithTypes = (columns) =>
  columns.map(({ name: columnName, type }) => ({
    name: columnName,
    type,
    typedName: Array(columnName.length).fill(typeChar(type)).join('')
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
      %c${name ? name : ''}
      `,
      'color:blue;font-weight:bold;',
      'color:black'
    );
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  console.log({ namedFilters });
  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: typedColumns,
        columnNames,
        namedFilters
      })}>
      <div style={{ width: 600 }}>
        <ParsedInput onCommit={handleCommit} />
      </div>
    </ParserProvider>
  );
};

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
      %c${name ? name : ''}
      `,
      'color:blue;font-weight:bold;',
      'color:black'
    );
    setFilter(addFilter(filter, f, { combineWith: 'and' }));
    if (name) {
      setNamedFilters(namedFilters.concat({ name, f }));
    }
  };

  const handleClearAll = () => {
    console.log('clear all');
  };

  return (
    <ParserProvider
      parser={parseFilter}
      suggestionProvider={createSuggestionProvider({
        columns: typedColumns,
        columnNames,
        namedFilters
      })}>
      <div style={{ width: 600 }}>
        <ParsedInput onCommit={handleCommit} />
      </div>
      {filter ? (
        <div style={{ width: 600, display: 'flex', border: 'solid 1px #ccc' }}>
          <Pillbox style={{ width: 600, flex: '1 1 auto' }}>
            {filterClauses(filter).map((clause, i) => (
              <Pill key={i} prefix={clause.column} label={clause.value} closeable selected />
            ))}
          </Pillbox>
          <Button
            className="hwButtonClear"
            style={{ flex: '0 0 28px', height: 28 }}
            onClick={handleClearAll}>
            <span className={`hwIconContainer`} data-icon="close-circle" />
          </Button>
        </div>
      ) : null}
    </ParserProvider>
  );
};

export const WithVisualiser = () => {
  const handleCommit = (result) => {
    console.log(JSON.stringify(result, null, 2));
  };
  return (
    <ComponentAnatomy style={{ width: '100%' }}>
      <ParserProvider
        parser={parseFilter}
        suggestionProvider={createSuggestionProvider({ columnNames })}>
        <div style={{ width: 600 }}>
          <ParsedInput onCommit={handleCommit} />
        </div>
      </ParserProvider>
    </ComponentAnatomy>
  );
};

const currencies = [
  { value: 'EUR' },
  { value: 'GBP' },
  { value: 'JPY' },
  { value: 'SEK' },
  { value: 'USD' }
];

const sortSelectedSuggestions = (selected, suggestions) => {
  const selectedValues = selected.map((i) => suggestions[i].value);

  const sortedSuggestions = suggestions.map((suggestion, i) => ({ ...suggestion, i }));

  sortedSuggestions.sort(({ value: v1, i: i1 }, { value: v2, i: i2 }) => {
    const s1 = selected.includes(i1) ? 1 : 0;
    const s2 = selected.includes(i2) ? 1 : 0;

    if (s1 === s2) {
      if (v1 === 'EOF') {
        return -1;
      } else if (v2 === 'EOF') {
        return 0;
      } else if (v1 > v2) {
        return 0;
      } else {
        return -1;
      }
    } else {
      return s2 - s1;
    }
  });

  const sortedSelected = selectedValues.map((v) =>
    sortedSuggestions.findIndex((s) => s.value === v)
  );

  return [sortedSelected, sortedSuggestions];
};

export const DefaultSuggestionList = () => {
  const selectedValues = useRef([]);

  const [highlighted, setHighlighted] = useState(0);
  const [selected, setSelected] = useState([]);
  const [suggestions, setSuggestions] = useState(currencies);

  const handleChange = (evt, newSelected) => {
    selectedValues.current = newSelected.map((idx) => suggestions[idx].value);
    const containsCommit = suggestions.find((s) => s.value === 'EOF');

    let updatedSelected = newSelected;
    let updatedSuggestions = suggestions;

    if (newSelected.length > 0 && !containsCommit) {
      updatedSuggestions = [{ value: 'EOF' }].concat(currencies);
      updatedSelected = newSelected.map((i) => i + 1);
    } else if (newSelected.length < 1 && containsCommit) {
      updatedSuggestions = currencies;
      updatedSelected = newSelected.filter((i) => i > 0).map((i) => i - 1);
    }

    [updatedSelected, updatedSuggestions] = sortSelectedSuggestions(
      updatedSelected,
      updatedSuggestions
    );

    setHighlighted(updatedSuggestions.findIndex((s) => s.value === 'EOF'));
    setSuggestions(updatedSuggestions);
    setSelected(updatedSelected);
  };

  return (
    <ComponentAnatomy>
      <SuggestionList
        highlightedIdx={highlighted}
        onChange={handleChange}
        onHighlight={setHighlighted}
        selected={selected}
        selectionStrategy="checkbox"
        suggestions={suggestions}
      />
    </ComponentAnatomy>
  );
};
