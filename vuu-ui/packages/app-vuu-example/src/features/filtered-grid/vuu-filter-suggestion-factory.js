const suggestColumnValues = async (column, text, isListItem, getSuggestions) => {
  let result;

  if (column === 'currency') {
    const values = ['CAD', 'EUR', 'GBX', 'USD'];
    result = suggestedValues(values, text, isListItem);
  } else {
    const suggestions = await getSuggestions([
      { table: 'instruments', module: 'SIMUL' },
      'exchange'
    ]);
    result = suggestedValues(suggestions, text, isListItem);
  }
  return Promise.resolve(result);
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
  ({ columnNames, namedFilters = [], getSuggestions }) =>
  (result, { token: tokenId, text, isListItem }) => {
    switch (tokenId) {
      case 'COLUMN-NAME':
        return suggestColumnNames(columnNames, text, isListItem);
      case 'COLUMN-VALUE':
        return suggestColumnValues(getCurrentColumn(result), text, isListItem, getSuggestions);
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
