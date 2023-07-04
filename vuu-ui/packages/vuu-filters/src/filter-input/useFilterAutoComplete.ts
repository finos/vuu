import {
  CompletionContext,
  CompletionSource,
  EditorState,
  getNodeByName,
  getValue,
  SyntaxNode,
  syntaxTree,
} from "@finos/vuu-codemirror";
import { Filter } from "@finos/vuu-filter-types";
import { MutableRefObject, useCallback } from "react";
import {
  IFilterSuggestionProvider,
  SuggestionType,
} from "./useCodeMirrorEditor";

export type FilterSubmissionMode = "and" | "or" | "replace" | "tab";

export type ApplyCompletion = (mode?: FilterSubmissionMode) => void;

const getOperator = (node: SyntaxNode, state: EditorState) => {
  let maybeColumnNode = node.prevSibling || node.parent;
  while (
    maybeColumnNode &&
    !["Column", "Operator", "In"].includes(maybeColumnNode.name)
  ) {
    maybeColumnNode = maybeColumnNode.prevSibling || maybeColumnNode.parent;
  }
  if (maybeColumnNode?.name === "In" || maybeColumnNode?.name === "Operator") {
    return getValue(maybeColumnNode, state);
  } else {
    return undefined;
  }
};

// Operators that are more than a single character in length may incur partial matches
// TODO need to check that previous token is a column
const getPartialOperator = (
  maybeOperatorNode: SyntaxNode,
  state: EditorState,
  columnName?: string
) => {
  const value = getValue(maybeOperatorNode, state);
  if (columnName === undefined || value === columnName) {
    return;
  }
  if (
    ["contains", "ends", "starts"].some((val) =>
      val.startsWith(value.toLowerCase())
    )
  ) {
    return value;
  } else {
    return undefined;
  }
};

const getClauseOperator = (node: SyntaxNode, state: EditorState) => {
  let maybeTargetNode = node.prevSibling || node.parent || node.lastChild;
  while (maybeTargetNode && maybeTargetNode.name === "⚠")
    maybeTargetNode = maybeTargetNode.prevSibling;
  if (maybeTargetNode && ["As", "Or", "And"].includes(maybeTargetNode.name)) {
    return getValue(maybeTargetNode, state);
  } else {
    return undefined;
  }
};

const getFilterName = (node: SyntaxNode, state: EditorState) => {
  if (node.name === "FilterName") {
    return getValue(node, state);
  } else {
    let maybeTargetNode = node.prevSibling || node.parent || node.lastChild;
    while (maybeTargetNode && maybeTargetNode.name !== "FilterName")
      maybeTargetNode = maybeTargetNode.prevSibling;
    if (maybeTargetNode && maybeTargetNode.name === "FilterName") {
      return getValue(node, state);
    }
  }
};

const getColumnName = (
  node: SyntaxNode,
  state: EditorState
): string | undefined => {
  const prevNode = node.prevSibling;
  if (prevNode?.name === "Column") {
    return getValue(prevNode, state);
  } else if (prevNode?.name === "Operator") {
    return getColumnName(prevNode, state);
  }
};

const getSetValues = (node: SyntaxNode, state: EditorState): string[] => {
  let maybeTargetNode = node.lastChild;
  const values: string[] = [];
  while (maybeTargetNode && maybeTargetNode.name !== "In") {
    const value = getValue(maybeTargetNode, state);
    if (value) {
      values.push(value);
    } else {
      break;
    }
    maybeTargetNode = maybeTargetNode.prevSibling;
  }
  return values;
};
export const FilterlNamedTerms: readonly string[] = [
  "Filter",
  "ParenthesizedExpression",
  "AndExpression",
  "OrExpression",
  "ColumnValueExpression",
  "ColumnSetExpression",
  "FilterName",
  "Column",
  "Operator",
  "Values",
  "Number",
  "String",
];
export const lastNamedChild = (node: SyntaxNode): SyntaxNode | null => {
  let { lastChild } = node;
  while (lastChild && !FilterlNamedTerms.includes(lastChild.name)) {
    lastChild = lastChild.prevSibling;
    console.log(lastChild?.name);
  }
  return lastChild;
};

export const useAutoComplete = (
  suggestionProvider: IFilterSuggestionProvider,
  onSubmit: MutableRefObject<ApplyCompletion>,
  existingFilter?: Filter
) => {
  const makeSuggestions = useCallback(
    async (
      context: CompletionContext,
      suggestionType: SuggestionType,
      optionalArgs: {
        columnName?: string;
        existingFilter?: Filter;
        filterName?: string;
        operator?: string;
        quoted?: boolean;
        onSubmit?: () => void;
        selection?: string[];
        startsWith?: string;
      } = {}
    ) => {
      const { startsWith = "" } = optionalArgs;
      const options = await suggestionProvider.getSuggestions(
        suggestionType,
        optionalArgs
      );
      return { from: context.pos - startsWith.length, options };
    },
    [suggestionProvider]
  );

  return useCallback(
    async (context: CompletionContext) => {
      const { state, pos } = context;
      const word = context.matchBefore(/\w*/) ?? {
        from: 0,
        to: 0,
        text: undefined,
      };

      const tree = syntaxTree(state);
      const nodeBefore = tree.resolveInner(pos, -1);
      console.log({ nodeBeforeName: nodeBefore.name });

      switch (nodeBefore.name) {
        case "Filter":
          if (context.pos === 0) {
            return makeSuggestions(context, "column");
          } else {
            const clauseOperator = getClauseOperator(nodeBefore, state);
            if (clauseOperator === "as") {
              return makeSuggestions(context, "name");
            } else {
              const filterName = getFilterName(nodeBefore, state);
              return makeSuggestions(context, "save", {
                onSubmit: onSubmit.current,
                existingFilter,
                filterName,
              });
            }
          }

        case "String":
          {
            // we only encounter a string as the right hand operand of a conditional expression
            const operator = getOperator(nodeBefore, state);
            const columnName = getColumnName(nodeBefore, state);
            // are we inside the string or immediately after it
            const { from, to } = nodeBefore;
            if (to - from === 2 && context.pos === from + 1) {
              // We are in an empty string, i.e between two quotes
              if (columnName && operator) {
                return makeSuggestions(context, "columnValue", {
                  columnName,
                  operator,
                  quoted: true,
                  startsWith: word.text,
                });
              }
            } else {
              console.log(
                `we have a string, column is ${columnName} ${from} ${to}`
              );
            }
          }
          break;

        case "As":
          return makeSuggestions(context, "name");

        case "FilterName":
          return makeSuggestions(context, "save", {
            onSubmit: onSubmit.current,
            existingFilter,
            filterName: getFilterName(nodeBefore, state),
          });

        case "Column": {
          const columnName = getValue(nodeBefore, state);
          const isPartialMatch = await suggestionProvider.isPartialMatch(
            "column",
            undefined,
            columnName
          );
          if (isPartialMatch) {
            return makeSuggestions(context, "column", {
              startsWith: columnName,
            });
          } else {
            return makeSuggestions(context, "operator", { columnName });
          }
        }

        case "⚠": {
          const columnName = getNodeByName(nodeBefore, state);
          const operator = getOperator(nodeBefore, state);
          // TODO check if we're mnatching a partial jojn operator
          const partialOperator = operator
            ? undefined
            : getPartialOperator(nodeBefore, state, columnName);

          if (partialOperator) {
            return makeSuggestions(context, "operator", {
              columnName,
              startsWith: partialOperator,
            });
          } else {
            return makeSuggestions(context, "columnValue", {
              columnName,
              operator,
              startsWith: word.text,
            });
          }
        }

        case "Identifier":
          {
            const clauseOperator = getClauseOperator(nodeBefore, state);
            if (clauseOperator === "as") {
              return {
                from: context.pos,
                options: [
                  {
                    label: "press ENTER to apply filter and save",
                    apply: () => onSubmit.current(),
                    boost: 5,
                  },
                ],
              };
            }
          }
          break;
        case "ColumnSetExpression":
        case "Values": {
          const columnName = getNodeByName(nodeBefore, state);
          const selection = getSetValues(nodeBefore, state);
          return makeSuggestions(context, "columnValue", {
            columnName,
            selection,
          });
        }
        case "Comma":
        case "LBrack": {
          const columnName = getNodeByName(nodeBefore, state) as string;
          return makeSuggestions(context, "columnValue", { columnName });
        }

        case "ColumnValueExpression":
          {
            const lastToken = nodeBefore.lastChild?.prevSibling;
            if (lastToken?.name === "Column") {
              return makeSuggestions(context, "operator", {
                columnName: getNodeByName(nodeBefore, state),
              });
            } else if (lastToken?.name === "Operator") {
              return makeSuggestions(context, "columnValue", {
                columnName: getNodeByName(lastToken, state),
                operator: getValue(lastToken, state),
              });
            }
          }
          break;

        case "In": {
          return {
            from: context.pos,
            options: [{ label: "[", apply: " [", type: "text" }],
          };
        }

        case "Eq": {
          return makeSuggestions(context, "columnValue", {
            columnName: getNodeByName(nodeBefore, state),
          });
        }

        case "AndExpression":
        case "OrExpression": {
          return makeSuggestions(context, "column");
        }

        default:
      }
    },
    [existingFilter, makeSuggestions, onSubmit, suggestionProvider]
  ) as CompletionSource;
};
