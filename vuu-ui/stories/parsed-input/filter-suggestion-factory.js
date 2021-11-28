const getStringValue = (value, propertyName) =>
  propertyName ? value[propertyName].toLowerCase() : value.toLowerCase();

// We accept string values or objects, in which case we will use object[propertyName]
const suggestedValues = (values, text = '', isListItem = false, propertyName) => {
  const lcText = text.toLowerCase();
  const result = values
    .filter((value) => isListItem || getStringValue(value, propertyName).startsWith(lcText))
    .map((v) => {
      const { name = v, type, typedName } = v;
      return {
        value: name,
        type,
        typedName,
        completion: name.toLowerCase().startsWith(lcText) ? name.slice(text.length) : name,
        isListItem
      };
    });

  return result;
};

const suggestedInstrumentValues = (values, text = '') =>
  values.map(([bbg, description]) => ({
    value: bbg,
    displayValue: [bbg, description],
    completion: bbg.slice(text.length)
  }));

const suggestColumnNames = (columns, text, isListItem) => {
  return suggestedValues(columns, text, isListItem, 'name');
};

const fetchInstruments = async (text) => {
  return new Promise(async (resolve, reject) => {
    const pattern = text || 'A';
    try {
      const response = await fetch(`http://127.0.0.1:9001/prefix/${pattern.toUpperCase()}`, {
        credentials: 'omit'
      });
      if (response.ok) {
        const text = await response.text();
        const json = JSON.parse(text);
        // console.log(JSON.stringify(json.null,2))
        resolve(suggestedInstrumentValues(json, pattern));
      } else {
        throw Error('fetch failed');
      }
    } catch (err) {
      //TODO we should include an error message here
      resolve([]);
    }
  });
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

const suggestColumnValues = async (column, text, isListItem) => {
  let result;
  switch (column) {
    case 'ccy':
      {
        const values = ['EUR', 'GBP', 'JPY', 'SEK', 'USD'];
        result = suggestedValues(values, text, isListItem);
      }
      break;

    case 'status':
      {
        const values = ['cancelled', 'complete', 'partial', 'error', 'suspended'];
        result = suggestedValues(values, text, isListItem);
      }
      break;

    case 'price':
      result = [{ value: 'enter a monetary value' }];
      break;

    case 'timestamp':
      result = [{ value: 'enter a timestamp' }];
      break;

    case 'quantity':
      result = [{ value: 'enter an integer value' }];
      break;

    case 'bbg':
      return fetchInstruments(text);

    default:
      result = [];
  }

  return Promise.resolve(result);
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

const buildColumns = (columnNames) => columnNames.map((name) => ({ name }));

// note: Returns a promise
const filterSuggestions =
  ({ columnNames, columns = buildColumns(columnNames), namedFilters = [] }) =>
  (result, { token: tokenId, text, isListItem }) => {
    switch (tokenId) {
      case 'COLUMN-NAME':
        // TODO return a list of objects, not just names
        return suggestColumnNames(columns, text, isListItem);
      case 'COLUMN-VALUE':
        return suggestColumnValues(getCurrentColumn(result), text, isListItem);
      case 'FILTER-NAME':
        return filterNameSavePrompt(text);
      case 'NAMED-FILTER':
        return suggestNamedFilters(namedFilters, text);
      default:
        return [];
    }
  };

export default filterSuggestions;
