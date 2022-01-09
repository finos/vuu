const suggestedValues = (values, text = '', operator = '', isListItem = false) => {
  const result = values
    .filter((value) => isListItem || value.toLowerCase().startsWith(text.toLowerCase()))
    .map((value) => ({
      value,
      completion: value.toLowerCase().startsWith(text.toLowerCase())
        ? value.slice(text.length)
        : value,
      isIllustration: operator === 'starts',
      isListItem
    }));

  return result;
};

const suggestColumnNames = (columnNames, text, isListItem) => {
  return suggestedValues(columnNames, text, undefined, isListItem);
};

const suggestColumnValues = async (column, text, operator, isListItem, getSuggestions, table) => {
  const suggestions = await getSuggestions([table, column]);
  return suggestedValues(suggestions, text, operator, isListItem);
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
const createSuggestionProvider =
  ({ columnNames, namedFilters = [], getSuggestions, table }) =>
  (result, { token: tokenId, operator, text, isListItem }) => {
    switch (tokenId) {
      case 'COLUMN-NAME':
        return suggestColumnNames(columnNames, text, isListItem);
      case 'COLUMN-VALUE':
        return suggestColumnValues(
          getCurrentColumn(result),
          text,
          operator,
          isListItem,
          getSuggestions,
          table
        );
      case 'FILTER-NAME':
        return filterNameSavePrompt(text);
      case 'NAMED-FILTER':
        return suggestNamedFilters(namedFilters, text);
      default:
        console.log(`[filter-suggestion-factory] no suggestions for ${tokenId} '${text}''`);
        return [];
    }
  };

export default createSuggestionProvider;
