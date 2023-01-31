import { MutableRefObject, useCallback, useMemo } from "react";
import {
  Completion,
  CompletionContext,
  CompletionSource,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode } from "@lezer/common";
import { EditorState } from "@codemirror/state";
import { ISuggestionProvider2 } from "./useColumnExpressionEditor";
import { parser } from "./column-language-parser/generated/column-parser";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";

export type ApplyCompletion = (mode?: "add" | "replace") => void;

const strictParser = parser.configure({ strict: true });

const isCompleteExpression = (src: string) => {
  try {
    strictParser.parse(src);
    return true;
  } catch (err) {
    return false;
  }
};

const isNumeric = (column: Completion & { columnType: VuuColumnDataType }) =>
  ["int", "double", "long"].includes(column.columnType ?? "");

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

const getValue = (node: SyntaxNode, state: EditorState) =>
  state.doc.sliceString(node.from, node.to);

const isOperator = (node?: SyntaxNode) =>
  node && ["Times", "Divide", "Plus", "Minus"].includes(node.name);

const getLastChild = (node: SyntaxNode) => {
  let { lastChild: childNode } = node;
  while (childNode) {
    if (
      [
        "Column",
        "Equal",
        "CallExpression",
        "OpenBrace",
        "BinaryExpression",
        "Times",
        "Divide",
        "Plus",
        "Minus",
      ].includes(childNode.name)
    ) {
      return childNode;
    } else {
      childNode = childNode.prevSibling;
    }
  }
};
const getFunctionName = (argListNode: SyntaxNode, state: EditorState) => {
  if (argListNode.name === "ArgList") {
    const functionNode = argListNode.prevSibling;
    if (functionNode) {
      return getValue(functionNode, state);
    }
  }
};

const getColumnName = (node: SyntaxNode, state: EditorState) => {
  if (node.firstChild?.name === "Column") {
    return getValue(node.firstChild, state);
  } else {
    let maybeColumnNode = node.prevSibling || node.parent;
    while (maybeColumnNode && maybeColumnNode.name !== "Column") {
      maybeColumnNode = maybeColumnNode.prevSibling || maybeColumnNode.parent;
    }
    if (maybeColumnNode) {
      return getValue(maybeColumnNode, state);
    }
  }
};

export const useColumnAutoComplete = (
  suggestionProvider: ISuggestionProvider2,
  onSubmit: MutableRefObject<ApplyCompletion>
) => {
  const expressionOperator = useMemo(() => {
    return [{ label: "=", apply: "= " }];
  }, []);

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

      switch (nodeBefore.name) {
        case "CallExpression":
          break;
        case "Function":
          break;
        case "BinaryExpression":
          {
            const lastChild = getLastChild(nodeBefore);
            console.log(`BInaryExpression, lastChild was ${lastChild?.name}`);
            if (lastChild?.name === "Column") {
              const options = await suggestionProvider.getSuggestions(
                "expression"
              );
              return { from: context.pos, options };
            } else if (isOperator(lastChild)) {
              const columns = await suggestionProvider.getSuggestions("column");
              const options = columns.filter(isNumeric);
              return { from: context.pos, options };
            }
          }

          break;
        case "Number":
          break;
        case "OpenBrace":
          {
            const options = await suggestionProvider.getSuggestions(
              "expression"
            );
            return { from: context.pos, options };
          }
          break;
        case "ArgList": {
          // const functionName = getFunctionName(nodeBefore, state);
          const lastArgument = getLastChild(nodeBefore);
          const prefix = lastArgument?.name === "OpenBrace" ? undefined : ",";
          let options = await suggestionProvider.getSuggestions("expression");
          options = prefix ? applyPrefix(options, ", ") : options;
          // TODO per function check for number of arguments expected
          if (lastArgument?.name !== "OpenBrace") {
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
            const options = await suggestionProvider.getSuggestions(
              "expression"
            );
            return { from: context.pos, options };
          }
          break;
        case "ParenthesizedExpression":
        case "ColumnDefinitionExpression":
          if (context.pos === 0) {
            return { from: context.pos, options: expressionOperator };
          } else {
            const lastChild = getLastChild(nodeBefore);
            if (lastChild?.name === "Equal") {
              const options = await suggestionProvider.getSuggestions(
                "expression"
              );
              return { from: context.pos, options };
            } else if (lastChild?.name === "Column") {
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
                  await suggestionProvider.getSuggestions(
                    "operator",
                    columnName
                  );

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
              console.log("what goes after a a CallExpression");
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

                const lastExpressionChild = getLastChild(lastChild);
                console.log({ lastExpressionChild });
                if (lastExpressionChild?.name === "Column") {
                  const columnName = getValue(lastExpressionChild, state);
                  const suggestions = await suggestionProvider.getSuggestions(
                    "operator",
                    columnName
                  );
                  options = options.concat(suggestions);
                }

                return {
                  from: context.pos,
                  options,
                };
              }
              console.log("what goes after a BinaryExpression");
            }
            break;
          }
        case "Column":
          {
            // TODO combine these
            const columnName = getColumnName(nodeBefore, state);
            const isPartialMatch = await suggestionProvider.isPartialMatch(
              "expression",
              undefined,
              word.text
            );

            if (isPartialMatch) {
              const options = await suggestionProvider.getSuggestions(
                "expression"
              );
              return { from: nodeBefore.from, options };
            }
          }
          break;
        case "CloseBrace":
          {
            console.log(
              "does closebrace denote an ARgList or a parenthetised expression ?"
            );
          }
          break;
        default: {
          if (nodeBefore?.prevSibling?.name === "FilterClause") {
            console.log("looks like we ight be a or|and operator");
          }
          console.log(
            `what do we have here ? ${nodeBefore.type.name} child of ${parent?.name}`
          );
        }
      }
    },
    [expressionOperator, onSubmit, suggestionProvider]
  ) as CompletionSource;
};
