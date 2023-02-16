import { Completion } from "@codemirror/autocomplete";
import { useTypeaheadSuggestions } from "@finos/vuu-data";
import {
  ColumnExpressionOperator,
  ColumnExpressionSuggestionType,
  IExpressionSuggestionProvider,
} from "@finos/vuu-datagrid-extras";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { isNumericColumn, isTextColumn } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import {
  ColumnFunctionDescriptor,
  columnFunctionDescriptors,
} from "./column-function-descriptors";
import { functionDocInfo } from "./functionDocInfo";

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

const toFunctionCompletion = (
  functionDescriptor: ColumnFunctionDescriptor
) => ({
  apply: `${functionDescriptor.name}( `,
  boost: 2,
  expressionType: functionDescriptor.type,
  info: () => functionDocInfo(functionDescriptor),
  label: functionDescriptor.name,
  type: "function",
});

const getAcceptedTypes = (fn?: ColumnFunctionDescriptor) => {
  if (fn) {
    if (typeof fn.accepts === "string") {
      return fn.accepts;
    } else if (Array.isArray(fn.accepts)) {
      if (fn.accepts.every((s) => s === "string")) {
        return "string";
      } else {
        return "any";
      }
    }
  }
  return "any";
};

const functions: Completion[] =
  columnFunctionDescriptors.map(toFunctionCompletion);

const getFunctions = ({ functionName }: ColumnOptions) => {
  if (functionName) {
    const fn = columnFunctionDescriptors.find((f) => f.name === functionName);
    const acceptedTypes = getAcceptedTypes(fn);
    if (fn) {
      switch (acceptedTypes) {
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
        const { columnName, functionName, startsWith, selection } = options;

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
          return (latestSuggestionsRef.current = withApplySpace(suggestions));
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
      valueType: ColumnExpressionSuggestionType,
      columnName?: string,
      pattern?: string
    ) => {
      const { current: latestSuggestions } = latestSuggestionsRef;
      let maybe = false;
      const suggestions =
        latestSuggestions || (await getSuggestions(valueType, { columnName }));
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
