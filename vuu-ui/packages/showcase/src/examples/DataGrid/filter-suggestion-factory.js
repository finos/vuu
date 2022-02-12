import { generateData } from '../../../public/tables/instruments/instruments';
import { config as schema } from '../../../public/tables/instruments/config';

const instruments = generateData();

const columnKeys = new Map();
schema.columns.forEach((column, i) => {
  columnKeys.set(column.name, i + 2);
});

const suggestColumnValues = async (column, text, isListItem) => {
  const result = _suggestedColumnValues(instruments, column, text, isListItem);
  return Promise.resolve(result);
};

const _suggestedColumnValues = (rows, column, text = '', isListItem = false) => {
  const key = columnKeys.get(column);
  const lcText = text.toLowerCase();
  let count = 0;
  let values = new Set();
  const result = [];

  // TODO don't do this for numeric fields

  for (const row of rows) {
    const value = row[key];
    if (text === '' || value.toLowerCase().startsWith(lcText)) {
      if (!values.has(value)) {
        values.add(value);
        count += 1;
      }

      if (count > 20) {
        break;
      }
    }
  }

  for (const value of values) {
    result.push({
      value,
      completion: value.toLowerCase().startsWith(text.toLowerCase())
        ? value.slice(text.length)
        : value,
      isListItem
    });
  }

  result.sort((a, b) => (a.value > b.value ? 1 : a.value < b.value ? -1 : 0));

  return result;
};

const suggestColumnNames = (columnNames, text, isListItem) => {
  return suggestedValues(columnNames, text, isListItem);
};

const getCurrentColumn = (filters, idx = 0) => {
  const f = filters[idx];
  if (!f) {
    return undefined;
  } else {
    if (f.op === 'or' || f.op === 'and') {
      return getCurrentColumn(f.filters, f.filters.length - 1);
    } else {
      return f.column;
    }
  }
};

const filterNameSavePrompt = (text) => {
  if (text === '') {
    return [
      {
        value: 'enter name for filter clause, then press ENTER to save and apply'
      }
    ];
  } else if (text.length) {
    return [{ value: 'EOF', displayValue: `EOF` }];
  }
  return [];
};

const suggestedValues = (values, text = '', isListItem = false) => {
  const result = values
    .filter((value) => isListItem || value.toLowerCase().startsWith(text.toLowerCase()))
    .map((value) => ({
      value,
      completion: value.toLowerCase().startsWith(text.toLowerCase())
        ? value.slice(text.length)
        : value,
      isListItem
    }));

  return result;
};

const suggestNamedFilters = async (filters, text) => {
  if (text.startsWith(':')) {
    return filters.map(({ name }) => ({
      value: `:${name}`,
      displayValue: name,
      completion: name
    }));
  } else {
    return [];
  }
};

// note: Returns a promise
const filterSuggestions =
  ({ columnNames, namedFilters = [] }) =>
  (result, { token: tokenId, text, isListItem }) => {
    switch (tokenId) {
      case 'COLUMN-NAME':
        return suggestColumnNames(columnNames, text, isListItem);
      case 'COLUMN-VALUE':
        return suggestColumnValues(getCurrentColumn(result), text, isListItem);
      case 'FILTER-NAME':
        return filterNameSavePrompt(text);
      case 'NAMED-FILTER':
        return suggestNamedFilters(namedFilters, text);
      default:
        console.log(`[filter-suggestion-factory] no suggestions for ${tokenId} '${text}''`);
        return [];
    }
  };

export default filterSuggestions;
