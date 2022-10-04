import { ColumnDataType, TypeaheadParams, VuuTable } from "@vuu-ui/data-types";
import {
  Filter,
  isCompositeFilter,
  NamedFilter,
  ParsedFilter,
  SuggestionItem,
  SuggestionProviderProps,
} from "@vuu-ui/datagrid-parsers";
import { SchemaColumn } from "@vuu-ui/data-remote";

type ObjectValue = { [key: string]: string };
type Value = string | ObjectValue;
type TypedColumn = {
  name: string;
  type: "string" | "number";
  typedName: string;
};

type SuggestionResult = {
  total: number;
  values: SuggestionItem[];
};

function getStringValue(value: Value, propertyName?: string) {
  if (typeof value === "string") {
    return value.toLowerCase();
  } else if (typeof propertyName === "string") {
    return value[propertyName].toLowerCase();
  }
}

const filterListValues = (
  values: string[],
  selectedValues: string[],
  text: string
) => {
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

const filterNonListValues = (
  values: Value[],
  text: string,
  propertyName?: string
) => {
  return values.filter((value) =>
    getStringValue(value, propertyName)?.startsWith(text)
  );
};

const suggestedValues = (
  values: Value[],
  text = "",
  operator = "",
  isListItem = false,
  propertyName?: string,
  selectedValues: string[] = []
): SuggestionItem[] => {
  // if the last selectedValue is not a 100% match, then its  a startsWith
  const lcText = text.toLowerCase();
  const result = isListItem
    ? filterListValues(values as string[], selectedValues, lcText)
    : filterNonListValues(values, lcText, propertyName);
  return result.map((v: any) => {
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
  columns: TypedColumn[],
  text: string,
  isListItem: boolean
): SuggestionResult => {
  const values = suggestedValues(columns, text, undefined, isListItem, "name");
  return { values, total: values.length };
};

const getTypeaheadParams = (
  table: VuuTable,
  column: string,
  text: string,
  selectedValues: string[]
): TypeaheadParams => {
  if (text !== "" && !selectedValues.includes(text.toLowerCase())) {
    return [table, column, text];
  } else {
    return [table, column];
  }
};

const suggestColumnValues = (
  column: SchemaColumn,
  text: string,
  operator: string | undefined,
  isListItem: boolean,
  selectedValues: string[],
  getSuggestions: (params: TypeaheadParams) => Promise<string[]>,
  table: VuuTable
): SuggestionResult | Promise<SuggestionResult> => {
  if (column.serverDataType === "number") {
    const message =
      text.length > 0
        ? "press SPACE or ENTER when done "
        : "Enter a number, press SPACE or ENTER when done ";
    return {
      values: [
        {
          completion: "",
          isIllustration: false,
          isListItem: false,
          isSelected: false,
          value: message,
        },
      ],
      total: 1,
    };
  } else {
    const params = getTypeaheadParams(table, column.name, text, selectedValues);
    return getSuggestions(params).then((suggestions) => {
      const values = suggestedValues(
        suggestions,
        text,
        operator,
        isListItem,
        undefined,
        selectedValues
      );
      return { isListItem, values, total: values.length };
    });
  }
};

const getCurrentColumn = (
  filters: ParsedFilter | Filter[],
  columns: SchemaColumn[],
  idx = 0
): SchemaColumn => {
  const f = filters[idx];
  if (!f) {
    throw Error(
      `VuuFilterSuggestionProvider cannot suggest column values before a column has been specified`
    );
  } else {
    if (isCompositeFilter(f)) {
      return getCurrentColumn(f.filters, columns, f.filters.length - 1);
    } else {
      const column = columns.find((col) => col.name === f.column);
      if (column) {
        return column;
      } else {
        throw Error(
          `VuuFilterSuggestionProvider filter references colum ${f.column}, which is not recognised`
        );
      }
    }
  }
};

const filterNameSavePrompt = (text: string) => {
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

const suggestNamedFilters = (
  filters: NamedFilter[],
  text: string
): SuggestionResult => {
  if (text.startsWith(":")) {
    console.log(`suggestNamedFilters text = '${text}'`, {
      filters,
    });

    const values: SuggestionItem[] = filters.map(({ name }) => ({
      isIllustration: false,
      isListItem: false,
      isSelected: false,
      value: `:${name}`,
      displayValue: name,
      completion: name,
    }));

    return {
      values,
      total: values.length,
    };
  } else {
    return { total: 0, values: [] };
  }
};

const toJSType = (type: ColumnDataType): "string" | "number" => {
  switch (type) {
    case "int":
    case "long":
    case "double":
      return "number";
    default:
      return "string";
  }
};

const typeChar = (type: ColumnDataType) => {
  switch (type) {
    case "int":
    case "long":
    case "double":
      return "n";
    default:
      return "s";
  }
};

const annotateWithTypes = (columns: SchemaColumn[]): TypedColumn[] =>
  columns.map(({ name: columnName, serverDataType }) => ({
    name: columnName,
    type: toJSType(serverDataType),
    typedName: Array(columnName.length).fill(typeChar(serverDataType)).join(""),
  }));

export const createSuggestionProvider =
  ({
    columns,
    namedFilters = [],
    getSuggestions,
    table,
  }: {
    columns: SchemaColumn[];
    namedFilters?: string[];
    getSuggestions: (
      params: [VuuTable, string] | [VuuTable, string, string]
    ) => Promise<string[]>;
    table: VuuTable;
  }) =>
  ({
    parsedFilter,
    isListItem = false,
    operator,
    token: tokenId,
    text,
    selectedTokens = [],
  }: SuggestionProviderProps) => {
    switch (tokenId) {
      case "COLUMN-NAME":
        return suggestColumnNames(annotateWithTypes(columns), text, isListItem);
      case "COLUMN-VALUE":
        return suggestColumnValues(
          getCurrentColumn(parsedFilter, columns),
          text,
          operator,
          isListItem,
          selectedTokens.map((t) => t.text.toLowerCase()),
          getSuggestions,
          table
        );
      case "FILTER-NAME":
        return filterNameSavePrompt(text);
      case "NAMED-FILTER":
        return suggestNamedFilters(namedFilters, text);
      default:
        console.log(
          `[filter-suggestion-factory] no suggestions for ${tokenId} '${text}''`
        );
        return { values: [] };
    }
  };
