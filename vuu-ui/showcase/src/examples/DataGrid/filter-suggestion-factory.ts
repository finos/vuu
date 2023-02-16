import { ColumnDescriptor } from '@finos/vuu-datagrid-types';
import { Row } from '@finos/vuu-utils';
import { config as schema } from '../../../public/tables/instruments/config';
import { generateData } from '../../../public/tables/instruments/instruments';

const instruments = generateData();

const columnKeys = new Map();
schema.columns.forEach((column: ColumnDescriptor, idx: number) => {
  columnKeys.set(column.name, idx + 2);
});

const suggestColumnValues = async (column: ColumnDescriptor, text: string, isListItem: boolean) => {
  const result = _suggestedColumnValues(instruments, column, text, isListItem);
  return Promise.resolve(result);
};

const _suggestedColumnValues = (rows: Row[], column: ColumnDescriptor, text = '', isListItem = false) => {
  const key = columnKeys.get(column);
  const lcText = text.toLowerCase();
  let count = 0;
  const values = new Set<string>();
  const result = [];

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

const suggestColumnNames = (columnNames: string[], text: string, isListItem: boolean) => {
  return suggestedValues(columnNames, text, isListItem);
};

const getCurrentColumn = (filters: any[], idx = 0): ColumnDescriptor | undefined => {
  const f = filters[idx];
  if (!f) {
    return undefined;
  }
  if (f.op === 'or' || f.op === 'and') {
    return getCurrentColumn(f.filters, f.filters.length - 1);
  }
  return f.column;
};

const suggestedValues = (values: string[], text = '', isListItem = false) => {
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

const suggestNamedFilters = async (filters: any[], text: string) => {
  if (text.startsWith(':')) {
    return filters.map((name: string) => ({
      value: `:${name}`,
      displayValue: name,
      completion: name
    }));
  } else {
    return [];
  }
};

const filterSuggestions =
  ( columnNames: string[], namedFilters = [] ) =>
  (result: any, token: string, text: string, isListItem: boolean ) => {
    switch (token) {
      case 'COLUMN-NAME':
        return suggestColumnNames(columnNames, text, isListItem);
      case 'COLUMN-VALUE':
        return suggestColumnValues(getCurrentColumn(result), text, isListItem);
      case 'FILTER-NAME':
        return filterNameSavePrompt(text);
      case 'NAMED-FILTER':
        return suggestNamedFilters(namedFilters, text);
      default:
        console.log(`[filter-suggestion-factory] no suggestions for ${token} '${text}''`);
        return [];
    }
  };

export default filterSuggestions;
