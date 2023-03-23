import {
  asNameSuggestion,
  booleanJoinSuggestions,
  Completion,
  CompletionContext,
  CompletionSource,
  EditorState,
  getNodeByName,
  getValue,
  syntaxTree,
} from "@finos/vuu-codemirror";
import { Filter } from "@finos/vuu-filter-types";
import { SyntaxNode } from "@lezer/common";
import { MutableRefObject, useCallback } from "react";
import {
  IFilterSuggestionProvider,
  SuggestionType,
} from "./useCodeMirrorEditor";

export type FilterSubmissionMode = "and" | "or" | "replace";

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

const promptForFilterName = (context: CompletionContext) => ({
  from: context.pos,
  options: [
    {
      label: "enter name for this filter",
      boost: 5,
    },
  ],
});

const makeSaveOrExtendSuggestions = (
  onSubmit: (mode?: FilterSubmissionMode) => void,
  existingFilter?: Filter,
  withJoinSuggestions = true
) => {
  const result = existingFilter
    ? ([
        {
          label: "REPLACE existing filter",
          apply: () => onSubmit("replace"),
          boost: 8,
        },
        {
          label: "AND existing filter",
          apply: () => onSubmit("and"),
          boost: 7,
        },
        {
          label: "OR existing filter",
          apply: () => onSubmit("or"),
          boost: 7,
        },
      ] as Completion[])
    : ([
        {
          label: "Press ENTER to submit",
          apply: () => onSubmit(),
          boost: 6,
        },
      ] as Completion[]);

  return withJoinSuggestions
    ? result.concat(booleanJoinSuggestions).concat(asNameSuggestion)
    : result;
};

const promptToSaveOrExtend = (
  context: CompletionContext,
  onSubmit: () => void,
  existingFilter?: Filter
) => ({
  from: context.pos,
  options: makeSaveOrExtendSuggestions(onSubmit, existingFilter),
});

const promptToSave = (
  context: CompletionContext,
  onSubmit: () => void,
  existingFilter?: Filter
) => ({
  from: context.pos,
  options: makeSaveOrExtendSuggestions(onSubmit, existingFilter, false),
});

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
        operator?: string;
        selection?: string[];
        startsWith?: string;
      } = {}
    ) => {
      const options = await suggestionProvider.getSuggestions(
        suggestionType,
        optionalArgs
      );
      const { startsWith = "" } = optionalArgs;
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
              return promptForFilterName(context);
            } else {
              return promptToSaveOrExtend(
                context,
                onSubmit.current,
                existingFilter
              );
            }
          }

        case "As":
          return promptForFilterName(context);

        case "FilterName":
          return promptToSave(context, onSubmit.current, existingFilter);

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
