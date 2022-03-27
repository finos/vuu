const filterListValues = (values, selectedValues, text) => {
  // If we have an exact match with one of the values, then we have a selection.
  // But if the last item is  a partial match only, then we are filtering. We
  // preserve already selected values.
  if (text === '' || values.some((value) => value.toLowerCase() === text)) {
    return values;
  } else {
    // Note the last selectedValue will always equal text, in this case it's our filter pattern
    const existingSelection = selectedValues.slice(0, -1);
    return existingSelection.concat(values.filter((value) => value.toLowerCase().startsWith(text)));
  }
};

const NO_SELECTION = [];

const getStringValue = (value, propertyName) =>
  propertyName ? value[propertyName].toLowerCase() : value.toLowerCase();

const filterNonListValues = (values, text, propertyName) =>
  values.filter((value) => getStringValue(value, propertyName).startsWith(text));

const suggestedValues = (
  values,
  text = '',
  operator = '',
  isListItem = false,
  propertyName,
  currentValues
) => {
  const selectedValues = currentValues?.map((item) => item.text.toLowerCase()) ?? NO_SELECTION;
  // if the last selectedValue is not a 100% match, then its  a startsWith
  const lcText = text.toLowerCase();
  const result = isListItem
    ? filterListValues(values, selectedValues, lcText)
    : filterNonListValues(values, lcText, propertyName);
  return result.map((v) => {
    const { name = v, type, typedName } = v;
    return {
      value: name,
      type,
      typedName,
      completion: name.toLowerCase().startsWith(lcText) ? name.slice(text.length) : name,
      isIllustration: operator === 'starts',
      isListItem,
      isSelected: selectedValues?.includes(name.toLowerCase())
    };
  });
};

const suggestColumnNames = (columns, text, isListItem) => {
  const values = suggestedValues(columns, text, undefined, isListItem, 'name');
  return { values, total: values.length };
};

const suggestColumnValues = async (
  column,
  text,
  operator,
  isListItem,
  currentValues,
  getSuggestions,
  table
) => {
  const suggestions = await getSuggestions([table, column]);
  const values = suggestedValues(suggestions, text, operator, isListItem, currentValues);
  return { values, total: values.length };
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
    return { values: [{ value: 'EOF', displayValue: `EOF` }] };
  }
  return { values: [] };
};

const suggestNamedFilters = async (filters, text) => {
  if (text.startsWith(':')) {
    return {
      values: filters.map(({ name }) => ({
        value: `:${name}`,
        displayValue: name,
        completion: name
      }))
    };
  } else {
    return { values: [] };
  }
};

const buildColumns = (columnNames) => columnNames.map((name) => ({ name }));

// note: Returns a promise
const createSuggestionProvider =
  ({
    columnNames,
    columns = buildColumns(columnNames),
    namedFilters = [],
    getSuggestions,
    table
  }) =>
  (result, { isListItem, operator, token: tokenId, text, values }) => {
    switch (tokenId) {
      case 'COLUMN-NAME':
        return suggestColumnNames(columns, text, isListItem);
      case 'COLUMN-VALUE':
        return suggestColumnValues(
          getCurrentColumn(result),
          text,
          operator,
          isListItem,
          values,
          getSuggestions,
          table
        );
      case 'FILTER-NAME':
        return filterNameSavePrompt(text);
      case 'NAMED-FILTER':
        return suggestNamedFilters(namedFilters, text);
      default:
        console.log(`[filter-suggestion-factory] no suggestions for ${tokenId} '${text}''`);
        return { values: [] };
    }
  };

export default createSuggestionProvider;
