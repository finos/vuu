import { Completion } from "@codemirror/autocomplete";
import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ISuggestionProvider, SuggestionType } from "@finos/vuu-filters";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { useCallback, useRef } from "react";

const tableColumns: Completion[] = [
  { label: "bbg" },
  { label: "description" },
  { label: "currency" },
  { label: "exchange" },
  { label: "lotSize" },
  { label: "isin" },
  { label: "ric" },
];

const doneCommand: Completion = {
  label: "Done",
  apply: "] ",
  type: "keyword",
  boost: 10,
};
const equalityOperators: Completion[] = [
  { label: "=", boost: 10 },
  { label: "!=", boost: 9 },
];
const stringOperators: Completion[] = [
  ...equalityOperators,
  { label: "in", boost: 6 },
  { label: "starts", boost: 5 },
  { label: "ends", boost: 4 },
];

const numericOperators: Completion[] = [
  ...equalityOperators,
  { label: ">", boost: 8 },
  { label: "<", boost: 7 },
];

const toSuggestions = (
  values: string[],
  quoted = false,
  prefix = ""
): Completion[] => {
  const quote = quoted ? '"' : "";
  return values.map((value) => ({
    label: value,
    apply: `${prefix}${quote}${value}${quote} `,
  }));
};

const withApplySpace = (suggestions: Completion[]): Completion[] =>
  suggestions.map((suggestion) => ({
    ...suggestion,
    apply: suggestion.label + " ",
  }));

const getTypeaheadParams = (
  table: VuuTable,
  column: string,
  text = "",
  selectedValues: string[] = []
): TypeaheadParams => {
  if (text !== "" && !selectedValues.includes(text.toLowerCase())) {
    return [table, column, text];
  }
  return [table, column];
};

export interface SuggestionProviderHookProps {
  columns: ColumnDescriptor[];
  table: VuuTable;
}

export const useSuggestionProvider = ({
  columns,
  table,
}: SuggestionProviderHookProps): ISuggestionProvider => {
  const latestSuggestionsRef = useRef<Completion[]>();
  const getTypeaheadSuggestions = useTypeaheadSuggestions();
  const getSuggestions = useCallback(
    async (
      valueType: SuggestionType,
      columnName?: string,
      startsWith?: string,
      selection?: string[]
    ): Promise<Completion[]> => {
      console.log("getSuggestions, using ", {
        valueType,
        columnName,
        startsWith,
        columns,
        getTypeaheadSuggestions,
        table,
        selection,
      });

      if (valueType === "operator") {
        const column = columns.find((col) => col.name === columnName);
        if (column) {
          switch (column.serverDataType) {
            case "string":
            case "char":
              return withApplySpace(stringOperators);
            case "int":
            case "long":
            case "double":
              return withApplySpace(numericOperators);
          }
        } else {
          console.warn(`'${columnName}' does not match any column name`);
        }
      }
      
      if (valueType === "column") {
        const suggestions = await tableColumns;
        return (latestSuggestionsRef.current = withApplySpace(suggestions));
      }
      
      if (columnName) {
        const column = columns.find((col) => col.name === columnName);
        const prefix = Array.isArray(selection)
          ? selection.length === 0
            ? "["
            : ","
          : "";
        const params = getTypeaheadParams(table, columnName, startsWith);
        const suggestions = await getTypeaheadSuggestions(params);
        // prob don;t want to save the preix
        latestSuggestionsRef.current = toSuggestions(
          suggestions,
          column?.serverDataType === "string",
          prefix
        );
        if (Array.isArray(selection) && selection?.length > 1) {
          return [doneCommand, ...latestSuggestionsRef.current];
        }
        return latestSuggestionsRef.current;
      }
      
      return [];
    },
    [columns, getTypeaheadSuggestions, table]
  );

  const isPartialMatch = useCallback(
    async (
      valueType: SuggestionType,
      columnName?: string,
      pattern?: string
    ) => {
      const { current: latestSuggestions } = latestSuggestionsRef;
      const suggestions =
        latestSuggestions ||
        (await getSuggestions(valueType, columnName, pattern));
      if (pattern && suggestions) {
        for (const option of suggestions) {
          if (option.label === pattern) {
            return false;
          } else if (option.label.startsWith(pattern)) {
            return true;
          }
        }
      }
      return false;
    },
    [getSuggestions]
  );

  return {
    getSuggestions,
    isPartialMatch,
  };
};
