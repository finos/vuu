import {
  Completion,
  CompletionContext,
  CompletionSource,
  EditorState,
  getNamedParentNode,
  getPreviousNode,
  getValue,
  syntaxTree,
} from "@finos/vuu-codemirror";
import { SyntaxNode } from "@lezer/common";
import { MutableRefObject, useCallback } from "react";
import { isCompleteExpression } from "./column-language-parser";
import {
  ColumnExpressionOperator,
  ColumnExpressionSuggestionOptions,
  ColumnExpressionSuggestionType,
  IExpressionSuggestionProvider,
} from "./useColumnExpressionEditor";

export type ApplyCompletion = (mode?: "add" | "replace") => void;

export type Operator = "";

const applyPrefix = (completions: Completion[], prefix?: string) =>
  prefix
    ? completions.map((completion) => ({
        ...completion,
        apply:
          typeof completion.apply === "function"
            ? completion.apply
            : `${prefix}${completion.apply ?? completion.label}`,
      }))
    : completions;

const isOperator = (node?: SyntaxNode): node is SyntaxNode =>
  node === undefined
    ? false
    : ["Times", "Divide", "Plus", "Minus"].includes(node.name);

const getLastChild = (node: SyntaxNode, context: CompletionContext) => {
  let { lastChild: childNode } = node;
  const { pos } = context;
  while (childNode) {
    const isBeforeCursor = childNode.from < pos;
    if (
      isBeforeCursor &&
      [
        "BinaryExpression",
        "BooleanOperator",
        "CallExpression",
        "CloseBrace",
        "Column",
        "Comma",
        "Condition",
        "ConditionalExpression",
        "Divide",
        "Equal",
        "If",
        "Minus",
        "OpenBrace",
        "ParenthesizedExpression",
        "Plus",
        "Times",
      ].includes(childNode.name)
    ) {
      if (childNode.name === "ParenthesizedExpression") {
        // extract the parenthesized expression
        const expression = childNode.firstChild?.nextSibling;
        if (expression) {
          childNode = expression;
        }
      }
      return childNode;
    } else {
      childNode = childNode.prevSibling;
    }
  }
};
const getFunctionName = (node: SyntaxNode, state: EditorState) => {
  if (node.name === "ArgList") {
    const functionNode = node.prevSibling;
    if (functionNode) {
      return getValue(functionNode, state);
    }
  } else if (node.name === "OpenBrace") {
    const maybeFunction = node.parent?.prevSibling;
    if (maybeFunction?.name === "Function") {
      return getValue(maybeFunction, state);
    }
  }
};

const getOperator = (node: SyntaxNode, state: EditorState) => {
  const prevNode = node.prevSibling;
  if (prevNode?.name === "BooleanOperator") {
    return getValue(prevNode, state) as ColumnExpressionOperator;
  }
};

const getColumnName = (
  node: SyntaxNode,
  state: EditorState
): string | undefined => {
  const prevNode = node.prevSibling;
  if (prevNode?.name === "Column") {
    return getValue(prevNode, state);
  } else if (prevNode?.name === "BooleanOperator") {
    return getColumnName(prevNode, state);
  }
};

const makeSuggestions = async (
  context: CompletionContext,
  suggestionProvider: IExpressionSuggestionProvider,
  suggestionType: ColumnExpressionSuggestionType,
  optionalArgs: ColumnExpressionSuggestionOptions = {}
) => {
  const options = await suggestionProvider.getSuggestions(
    suggestionType,
    optionalArgs
  );
  const { startsWith = "" } = optionalArgs;
  return { from: context.pos - startsWith.length, options };
};

const handleConditionalExpression = (
  node: SyntaxNode,
  context: CompletionContext,
  suggestionProvider: IExpressionSuggestionProvider,
  maybeComplete?: boolean,
  onSubmit?: () => void
) => {
  const lastChild = getLastChild(node, context);
  console.log(`conditional expression last child ${lastChild?.name}`);
  switch (lastChild?.name) {
    case "If":
      return makeSuggestions(context, suggestionProvider, "expression", {
        prefix: "( ",
      });
    case "OpenBrace":
      break;
    case "Condition":
      return makeSuggestions(context, suggestionProvider, "expression", {
        prefix: ", ",
      });
    case "CloseBrace":
      if (maybeComplete) {
        const options: Completion[] = [
          {
            apply: () => {
              onSubmit?.();
            },
            label: "Save Expression",
            boost: 10,
          },
        ];
        return { from: context.pos, options };
      }
  }
};

const promptToSave = (context: CompletionContext, onSubmit: () => void) => {
  const options: Completion[] = [
    {
      apply: () => {
        onSubmit?.();
      },
      label: "Save Expression",
      boost: 10,
    },
  ];
  return { from: context.pos, options };
};

export const useColumnAutoComplete = (
  suggestionProvider: IExpressionSuggestionProvider,
  onSubmit: MutableRefObject<ApplyCompletion>
) => {
  const makeSuggestions = useCallback(
    async (
      context: CompletionContext,
      suggestionType: ColumnExpressionSuggestionType,
      optionalArgs: ColumnExpressionSuggestionOptions = {}
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
      const text = state.doc.toString();
      const maybeComplete = isCompleteExpression(text);

      console.log({ nodeBeforeName: nodeBefore.name });

      switch (nodeBefore.name) {
        case "If": {
          console.log(`conditional expression  If`);
          return makeSuggestions(context, "expression", { prefix: "( " });
        }
        case "Condition":
          {
            const lastChild = getLastChild(nodeBefore, context);
            if (lastChild?.name === "Column") {
              // is this the first term ?
              const prevChild = getPreviousNode(lastChild);
              if (prevChild?.name !== "BooleanOperator") {
                return makeSuggestions(context, "condition-operator", {
                  columnName: getValue(lastChild, state),
                });
              }
              console.log(
                `Condition last child Column, prev child ${prevChild?.name}`
              );
            } else if (lastChild?.name === "BooleanOperator") {
              // we need the type of the expression on the other side of the operator
              return makeSuggestions(context, "expression");
            }
            console.log(`condition  last child ${lastChild?.name}`);
          }
          break;
        case "ConditionalExpression":
          return handleConditionalExpression(
            nodeBefore,
            context,
            suggestionProvider
          );
        case "String":
          {
            // we only encounter a string as the right hand operand of a conditional expression
            const operator = getOperator(nodeBefore, state);
            const columnName = getColumnName(nodeBefore, state);
            // are we inside the string or immediately after it
            const { from, to } = nodeBefore;
            console.log(`from ${from} to ${to} pos ${context.pos}`);
            if (to - from === 2 && context.pos === from + 1) {
              // We are in an empty string, i.e between two quotes
              if (columnName && operator) {
                return makeSuggestions(context, "columnValue", {
                  columnName,
                  operator,
                  startsWith: word.text,
                });
              }
            } else if (to - from > 2 && context.pos === to) {
              // NOte we couls also offer AND/OR to extend the condition
              return makeSuggestions(context, "expression", {
                prefix: ", ",
              });
            }
            console.log(
              `we have a string, column is ${columnName} ${from} ${to}`
            );
          }
          break;
        case "BooleanOperator":
          // we need the type of the expression on the other side of the operator
          return makeSuggestions(context, "expression");

        case "BinaryExpression":
          {
            const lastChild = getLastChild(nodeBefore, context);
            if (lastChild?.name === "Column") {
              return makeSuggestions(context, "expression");
            } else if (isOperator(lastChild)) {
              const operator = lastChild.name as ColumnExpressionOperator;
              return makeSuggestions(context, "column", { operator });
            }
          }

          break;
        case "OpenBrace":
          {
            // Might be a function expression, might be parenthesized
            const functionName = getFunctionName(nodeBefore, state);
            // If not function, what came before - if it's an operator
            // we restrict to numerics
            return makeSuggestions(context, "expression", { functionName });
          }
          break;
        case "ArgList": {
          const functionName = getFunctionName(nodeBefore, state);
          const lastArgument = getLastChild(nodeBefore, context);
          const prefix = lastArgument?.name === "OpenBrace" ? undefined : ",";
          let options = await suggestionProvider.getSuggestions("expression", {
            functionName,
          });
          options = prefix ? applyPrefix(options, ", ") : options;
          // TODO per function check for number of arguments expected
          if (
            lastArgument?.name !== "OpenBrace" &&
            lastArgument?.name !== "Comma"
          ) {
            options = [
              {
                apply: ") ",
                boost: 10,
                label: "Done - no more arguments",
              } as Completion,
            ].concat(options);
          }
          return { from: context.pos, options };
        }
        case "Equal":
          if (text.trim() === "=") {
            return makeSuggestions(context, "expression");
          }
          break;
        case "ParenthesizedExpression":
        case "ColumnDefinitionExpression":
          if (context.pos === 0) {
            return makeSuggestions(context, "expression");
          } else {
            const lastChild = getLastChild(nodeBefore, context);
            if (lastChild?.name === "Column") {
              if (maybeComplete) {
                // We come in here is the columns IS complete, too (ie has space after)
                const options: Completion[] = [
                  {
                    apply: () => {
                      onSubmit.current();
                    },
                    label: "Save Expression",
                    boost: 10,
                  },
                ];
                const columnName = getValue(lastChild, state);
                const columnOptions: Completion[] =
                  await suggestionProvider.getSuggestions("operator", {
                    columnName,
                  });

                return {
                  from: context.pos,
                  options: options.concat(columnOptions),
                };
              }
            } else if (lastChild?.name === "CallExpression") {
              if (maybeComplete) {
                const options = [
                  {
                    apply: () => {
                      onSubmit.current();
                    },
                    label: "Save Expression",
                    boost: 10,
                  },
                ];
                return {
                  from: context.pos,
                  options,
                };
              }
            } else if (lastChild?.name === "BinaryExpression") {
              if (maybeComplete) {
                let options: Completion[] = [
                  {
                    apply: () => {
                      onSubmit.current();
                    },
                    label: "Save Expression",
                    boost: 10,
                  },
                ];

                const lastExpressionChild = getLastChild(lastChild, context);
                if (lastExpressionChild?.name === "Column") {
                  const columnName = getValue(lastExpressionChild, state);
                  // TODO need to exclude columns already included in expression

                  const suggestions = await suggestionProvider.getSuggestions(
                    "operator",
                    { columnName }
                  );
                  options = options.concat(suggestions);
                }

                return {
                  from: context.pos,
                  options,
                };
              }
            } else if (lastChild?.name === "ConditionalExpression") {
              return handleConditionalExpression(
                lastChild,
                context,
                suggestionProvider,
                maybeComplete,
                onSubmit.current
              );
            }
            break;
          }
        case "Column":
          {
            const isPartialMatch = await suggestionProvider.isPartialMatch(
              "expression",
              undefined,
              word.text
            );

            if (isPartialMatch) {
              return makeSuggestions(context, "expression", {
                startsWith: word.text,
              });
            }
          }
          break;
        case "Comma":
          {
            const parentNode = getNamedParentNode(nodeBefore);
            if (parentNode?.name === "ConditionalExpression") {
              return makeSuggestions(context, "expression");
            }
          }
          break;

        case "CloseBrace":
          {
            const parentNode = getNamedParentNode(nodeBefore);
            if (parentNode?.name === "ConditionalExpression") {
              return handleConditionalExpression(
                parentNode,
                context,
                suggestionProvider,
                maybeComplete,
                onSubmit.current
              );
            } else if (parentNode?.name === "ArgList") {
              if (maybeComplete) {
                return promptToSave(context, onSubmit.current);
              }
            }
            console.log(
              `does closebrace denote an ARgList or a parenthetised expression ? ${parentNode}`
            );
          }
          break;
        default: {
          if (nodeBefore?.prevSibling?.name === "FilterClause") {
            console.log("looks like we ight be a or|and operator");
          }
        }
      }
    },
    [makeSuggestions, onSubmit, suggestionProvider]
  ) as CompletionSource;
};
