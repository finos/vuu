import { Completion } from "@codemirror/autocomplete";
import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  getSuggestionsType,
  ISuggestionProvider,
  SuggestionType,
} from "@finos/vuu-filters";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { useCallback, useRef } from "react";

const NO_OPTIONS = {};
export interface VuuCompletion extends Completion {
  isIllustration?: boolean;
}

const suggestColumns = (columns: ColumnDescriptor[]) =>
  columns.map((column) => ({
    label: column.name,
  }));

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
  prefix = "",
  isIllustration = false
): VuuCompletion[] => {
  const quote = quoted ? '"' : "";
  return values.map((value) => ({
    isIllustration,
    label: value,
    apply: isIllustration
      ? `${quote}${prefix}${quote}`
      : `${prefix}${quote}${value}${quote} `,
  }));
};

const withApplySpace = (
  suggestions: Completion[],
  startsWith = ""
): Completion[] =>
  suggestions
    .filter((sugg) => startsWith === "" || sugg.label.startsWith(startsWith))
    .map((suggestion) => ({
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

export const useFilterSuggestionProvider = ({
  columns,
  table,
}: SuggestionProviderHookProps): ISuggestionProvider => {
  const latestSuggestionsRef = useRef<Completion[]>();
  const getTypeaheadSuggestions = useTypeaheadSuggestions();
  const getSuggestions: getSuggestionsType = useCallback(
    async (
      valueType: SuggestionType,
      { columnName, operator, startsWith, selection } = NO_OPTIONS
    ): Promise<Completion[]> => {
      if (valueType === "operator") {
        const column = columns.find((col) => col.name === columnName);
        if (column) {
          switch (column.serverDataType) {
            case "string":
            case "char":
              return withApplySpace(stringOperators, startsWith);
            case "int":
            case "long":
            case "double":
              return withApplySpace(numericOperators);
          }
        } else {
          console.warn(`'${columnName}' does not match any column name`);
        }
      } else if (valueType === "column") {
        const suggestions = await suggestColumns(columns);
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
        // prob don't want to save the prefix
        const isIllustration = operator === "starts";
        latestSuggestionsRef.current = toSuggestions(
          suggestions,
          column?.serverDataType === "string",
          isIllustration ? startsWith : prefix,
          isIllustration
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
      // const { current: latestSuggestions } = latestSuggestionsRef;
      const suggestions =
        // latestSuggestions && latestSuggestions.length > 0
        //   ? latestSuggestions
        await getSuggestions(valueType, { columnName });

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
