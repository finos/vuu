import {
  SuggestionItem,
  SuggestionProvider,
  SuggestionProviderProps,
  SuggestionProviderResult,
  SuggestionResult,
} from "@vuu-ui/datagrid-parsers";
import { UIToken } from "@vuu-ui/datagrid-parsers/src/filter-parser/ui-tokens";

const filterListValues = (values, selectedValues, text) => {
  console.log(
    `filterListValues values ${values.join(",")} selected ${selectedValues.join(
      ","
    )} text ${text}`
  );
  // If we have an exact match with one of the values, then we have a selection.
  // But if the last item is  a partial match only, then we are filtering. We
  // preserve already selected values.
  if (text === "" || values.some((value) => value.toLowerCase() === text)) {
    return values;
  } else {
    // Note the last selectedValue will always equal text, in this case it's our filter pattern
    const existingSelection = selectedValues.slice(0, -1);
    return existingSelection.concat(
      values.filter((value) => value.toLowerCase().startsWith(text))
    );
  }
};

const NO_SELECTION = [] as const;

const getStringValue = (value, propertyName) =>
  propertyName ? value[propertyName].toLowerCase() : value.toLowerCase();

const filterNonListValues = (values, text, propertyName) =>
  values.filter((value) =>
    getStringValue(value, propertyName).startsWith(text)
  );

// We accept string values or objects, in which case we will use object[propertyName]
const suggestedValues = (
  values: any[],
  text = "",
  operator = "",
  isListItem = false,
  propertyName: string,
  currentValues?: UIToken[]
): SuggestionItem[] => {
  const selectedValues =
    currentValues?.map((item) => item.text.toLowerCase()) ?? NO_SELECTION;
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
      completion: name.toLowerCase().startsWith(lcText)
        ? name.slice(text.length)
        : name,
      isIllustration: operator === "starts",
      isListItem,
      isSelected: selectedValues?.includes(name.toLowerCase()),
    };
  });
};

const suggestColumnNames = (
  columns: Array<{ name: string }>,
  text: string,
  isListItem = false
): SuggestionResult => {
  const values = suggestedValues(columns, text, undefined, isListItem, "name");
  return { values, total: values.length };
};

const suggestColumnValues = async (
  column: string,
  text: string,
  operator: string | undefined,
  isListItem = false,
  currentValues?: UIToken[]
): Promise<SuggestionProviderResult> => {
  let values;
  switch (column) {
    case "ccy":
      {
        const ccy = ["EUR", "GBP", "JPY", "SEK", "USD"];
        values = suggestedValues(
          ccy,
          text,
          operator,
          isListItem,
          undefined,
          currentValues
        );
      }
      break;

    case "exchange":
      {
        const exchange = [
          "XAMS/ENA-MAIN",
          "XLON/LSE-SETS",
          "XNGS/NAS-GSM",
          "XNYS/NYS-MAIN",
        ];
        values = suggestedValues(
          exchange,
          text,
          operator,
          isListItem,
          undefined,
          currentValues
        );
      }
      break;
    case "status":
      {
        const status = [
          "cancelled",
          "complete",
          "partial",
          "error",
          "suspended",
        ];
        values = suggestedValues(
          status,
          text,
          operator,
          isListItem,
          undefined,
          currentValues
        );
      }
      break;

    case "price":
      values = [{ value: "enter a monetary value" }];
      break;

    case "timestamp":
      values = [{ value: "enter a timestamp" }];
      break;

    case "quantity":
      values = [{ value: "enter an integer value" }];
      break;

    case "bbg":
      return fetchInstruments(text);

    default:
      values = [];
  }

  return Promise.resolve({ values, total: values.length, isListItem });
};

const suggestedInstrumentValues = (values, text = "") =>
  values.map(([bbg, description]) => ({
    value: bbg,
    displayValue: [bbg, description],
    completion: bbg.slice(text.length),
  }));

const fetchInstruments = async (text) => {
  return new Promise((resolve) => {
    const pattern = text || "A";
    fetch(`http://127.0.0.1:9001/prefix/${pattern.toUpperCase()}`, {
      credentials: "omit",
    })
      .then((response) => response.json())
      .then((json) => {
        resolve({
          values: suggestedInstrumentValues(json, pattern),
          total: 100,
        });
      })
      .catch(() => {
        throw Error("fetch failed");
      });
  });
};

const getCurrentColumn = (filters, idx = 0) => {
  const f = filters[idx];
  if (!f) {
    return undefined;
  } else {
    if (f.op === "or" || f.op === "and") {
      return getCurrentColumn(f.filters, f.filters.length - 1);
    } else {
      return f.column;
    }
  }
};

const filterNameSavePrompt = (text) => {
  if (text === "") {
    return [
      {
        value:
          "enter name for filter clause, then press ENTER to save and apply",
      },
    ];
  } else if (text.length) {
    return { values: [{ value: "EOF", displayValue: `EOF` }] };
  }
  return { values: [] };
};

const suggestNamedFilters = async (filters, text) => {
  if (text.startsWith(":")) {
    return {
      values: filters.map(({ name }) => ({
        value: `:${name}`,
        displayValue: name,
        completion: name,
      })),
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
  }: {
    columnNames: string[];
    columns: Array<{ name: string }>;
    namedFilters?: string[];
  }): SuggestionProvider =>
  ({ parsedFilter, isListItem, operator, token: tokenId, text, values }) => {
    console.log(
      `SuggestionProvider selectedSuggestions ${JSON.stringify(values)}`
    );
    switch (tokenId) {
      case "COLUMN-NAME":
        // TODO return a list of objects, not just names
        return suggestColumnNames(columns, text, isListItem);
      case "COLUMN-VALUE":
        return suggestColumnValues(
          getCurrentColumn(parsedFilter),
          text,
          operator,
          isListItem,
          values
        );
      case "FILTER-NAME":
        return filterNameSavePrompt(text);
      case "NAMED-FILTER":
        return suggestNamedFilters(namedFilters, text);
      default:
        return { values: [] };
    }
  };

export default createSuggestionProvider;
