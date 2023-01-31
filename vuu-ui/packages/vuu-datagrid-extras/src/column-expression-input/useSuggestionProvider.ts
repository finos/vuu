import { Completion } from "@codemirror/autocomplete";
import { useTypeaheadSuggestions } from "@finos/vuu-data";
import {
  ColumnExpressionSuggestionType,
  IExpressionSuggestionProvider,
} from "@finos/vuu-datagrid-extras";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { SuggestionType } from "@finos/vuu-filters";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { isNumericColumn } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import { columnFunctionDescriptors } from "./column-function-descriptors";

const functionDocInfo = (
  functionName: string,
  params: string,
  type: string,
  description: string
) => {
  const div = document.createElement("div");
  div.className = "vuuFunctionDoc";
  div.innerHTML = `
    <div class="function-heading">
      <span class="function-name">${functionName}</span>
      <span class="param-list">${params}</span>
      <span class="function-type">${type}</span>
    </div>
    <p>${description}</p>
  `;
  return div;
};

const showParenthesesInfo = () => {
  const div = document.createElement("div");
  div.innerHTML = `
    <div>Ass Parentheses</div>
    <p>Use parentheses to control order of evaluation oe expression clauses</p>
  `;
  return div;
};

const withApplySpace = (suggestions: Completion[]): Completion[] =>
  suggestions.map((suggestion) => ({
    ...suggestion,
    apply: suggestion.label + " ",
  }));

const getColumns = (columns: ColumnDescriptor[]) => {
  return columns.map((column) => ({
    label: column.label ?? column.name,
    boost: 5,
    type: "column",
    expressionType: column.serverDataType,
  }));
};

const parentheses: Completion = {
  apply: "(",
  boost: 9,
  info: () => showParenthesesInfo(),
  label: "(",
};

const operators = [
  {
    apply: "* ",
    boost: 2,
    label: "*",
    type: "operator",
  },
  {
    apply: "/ ",
    boost: 2,
    label: "/",
    type: "operator",
  },
  {
    apply: "+ ",
    boost: 2,
    label: "+",
    type: "operator",
  },
  {
    apply: "- ",
    boost: 2,
    label: "-",
    type: "operator",
  },
];

const isApplicable = (column: ColumnDescriptor, suggestion: Completion) => {
  console.log({ column });
  return isNumericColumn(column);
};

const functionCompletions: Completion[] = columnFunctionDescriptors.map(
  ({ name, description, params, type }) => ({
    apply: `${name}( `,
    boost: 2,
    expressionType: type,
    info: () => functionDocInfo(name, params.description, type, description),
    label: name,
    type: "function",
  })
);

const doneCommand: Completion = {
  label: "Done",
  apply: "] ",
  type: "keyword",
  boost: 10,
};

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

const getTypeaheadParams = (
  table: VuuTable,
  column: string,
  text = "",
  selectedValues: string[] = []
): TypeaheadParams => {
  if (text !== "" && !selectedValues.includes(text.toLowerCase())) {
    return [table, column, text];
  } else {
    return [table, column];
  }
};

export interface SuggestionProviderHookProps {
  columns: ColumnDescriptor[];
  table: VuuTable;
}

const NONE = {};

export const useSuggestionProvider = ({
  columns,
  table,
}: SuggestionProviderHookProps): IExpressionSuggestionProvider => {
  const latestSuggestionsRef = useRef<Completion[]>();
  const getTypeaheadSuggestions = useTypeaheadSuggestions();
  const getSuggestions: IExpressionSuggestionProvider["getSuggestions"] =
    useCallback(
      async (valueType, options = NONE): Promise<Completion[]> => {
        const { columnName, filterName, startsWith, selection } = options;

        console.log("%cgetSuggestions, using ", "color: green", {
          valueType,
          columnName,
          startsWith,
          columns,
          getTypeaheadSuggestions,
          table,
          selection,
        });

        if (valueType === "expression") {
          const expressions = withApplySpace(getColumns(columns)).concat(
            functionCompletions
          );

          const suggestions = await expressions;
          return (latestSuggestionsRef.current = suggestions);
        } else if (valueType === "column") {
          const suggestions = await getColumns(columns);
          return (latestSuggestionsRef.current = withApplySpace(suggestions));
        } else if (valueType === "operator") {
          const suggestions = await operators;
          const column = columns.find((col) => col.name === columnName);
          const relevantSuggestions = suggestions.filter((s) =>
            isApplicable(column, s)
          );
          return (latestSuggestionsRef.current =
            withApplySpace(relevantSuggestions));
        } else if (columnName) {
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
          } else {
            return latestSuggestionsRef.current;
          }
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
      let maybe = false;
      const suggestions =
        latestSuggestions ||
        (await getSuggestions(valueType, columnName, pattern));
      if (pattern && suggestions) {
        for (const option of suggestions) {
          if (option.label === pattern) {
            return false;
          } else if (option.label.startsWith(pattern)) {
            maybe = true;
          }
        }
      }
      return maybe;
    },
    [getSuggestions]
  );

  return {
    getSuggestions,
    isPartialMatch,
  };
};
