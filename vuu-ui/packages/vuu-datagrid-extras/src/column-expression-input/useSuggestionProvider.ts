import { Completion } from "@codemirror/autocomplete";
import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { IExpressionSuggestionProvider } from "@finos/vuu-datagrid-extras";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { SuggestionType } from "@finos/vuu-filters";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { isNumericColumn, isTextColumn } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import {
  ColumnFunctionDescriptor,
  columnFunctionDescriptors,
} from "./column-function-descriptors";
import { createEl } from "@finos/vuu-utils";
import { ColumnExpressionOperator } from "@finos/vuu-datagrid-extras";

const functionDocInfo = (
  functionName: string,
  params: string,
  type: string,
  description: string
) => {
  const div = createEl("div", "vuuFunctionDoc");
  const child1 = createEl("div", "function-heading");

  const child1_1 = createEl("span", "function-name", functionName);
  const child1_2 = createEl("span", "param-list", params);
  const child1_3 = createEl("span", "function-type", type);
  child1.appendChild(child1_1);
  child1.appendChild(child1_2);
  child1.appendChild(child1_3);

  const child2 = createEl("p", undefined, description);

  div.appendChild(child1);
  div.appendChild(child2);

  return div;
};

const showParenthesesInfo = () => {
  const div = createEl("div");
  const child1 = createEl("div", undefined, "Add Parentheses");
  const child2 = createEl(
    "p",
    undefined,
    "Use parentheses to control order of evaluation oe expression clauses"
  );
  div.appendChild(child1);
  div.appendChild(child2);
  return div;
};

const withApplySpace = (suggestions: Completion[]): Completion[] =>
  suggestions.map((suggestion) => ({
    ...suggestion,
    apply: suggestion.label + " ",
  }));

type ColumnOptions = {
  functionName?: string;
  operator?: ColumnExpressionOperator;
};

const getValidColumns = (
  columns: ColumnDescriptor[],
  { functionName, operator }: ColumnOptions
) => {
  if (operator) {
    return columns.filter(isNumericColumn);
  } else if (functionName) {
    const fn = columnFunctionDescriptors.find((f) => f.name === functionName);
    if (fn) {
      switch (fn.accepts) {
        case "string":
          return columns.filter(isTextColumn);
        case "number":
          return columns.filter(isNumericColumn);
        default:
          return columns;
      }
    }
  }
  return columns;
};

const getColumns = (columns: ColumnDescriptor[], options: ColumnOptions) => {
  const validColumns = getValidColumns(columns, options);
  return validColumns.map((column) => ({
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

const toFunctionCompletion = ({
  name,
  description,
  params,
  type,
}: ColumnFunctionDescriptor) => ({
  apply: `${name}( `,
  boost: 2,
  expressionType: type,
  info: () => functionDocInfo(name, params.description, type, description),
  label: name,
  type: "function",
});

const functions: Completion[] =
  columnFunctionDescriptors.map(toFunctionCompletion);

const getFunctions = ({ functionName }: ColumnOptions) => {
  if (functionName) {
    const fn = columnFunctionDescriptors.find((f) => f.name === functionName);
    if (fn) {
      switch (fn.accepts) {
        case "string":
          return columnFunctionDescriptors
            .filter((f) => f.type === "string" || f.type === "variable")
            .map(toFunctionCompletion);
        case "number":
          return columnFunctionDescriptors
            .filter((f) => f.type === "number" || f.type === "variable")
            .map(toFunctionCompletion);
        default:
      }
    }
  }
  return functions;
};

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
        const { columnName, operator, functionName, startsWith, selection } =
          options;

        console.log("%cgetSuggestions, using ", "color: green", {
          valueType,
          columnName,
          functionName,
          startsWith,
          columns,
          selection,
        });

        if (valueType === "expression") {
          const expressions = withApplySpace(
            getColumns(columns, { functionName })
          ).concat(getFunctions(options));

          const suggestions = await expressions;
          return (latestSuggestionsRef.current = suggestions);
        } else if (valueType === "column") {
          const suggestions = await getColumns(columns, options);
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
