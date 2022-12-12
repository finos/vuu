import { MutableRefObject, useCallback, useMemo } from "react";
import { CompletionContext, CompletionSource } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode } from "@lezer/common";
import { EditorState } from "@codemirror/state";
import { ISuggestionProvider } from "./useCodeMirrorEditor";
import { Filter } from "@vuu-ui/vuu-filters";

export type ApplyCompletion = (mode?: "add" | "replace") => void;

const getValue = (node: SyntaxNode, state: EditorState) =>
  state.doc.sliceString(node.from, node.to);

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

const getClauseOperator = (node: SyntaxNode, state: EditorState) => {
  const maybeTargetNode = node.prevSibling || node.parent;
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

export const useAutoComplete = (
  suggestionProvider: ISuggestionProvider,
  onSubmit: MutableRefObject<ApplyCompletion>,
  existingFilter?: Filter
) => {
  const joinOperands = useMemo(() => {
    const operands = [
      { label: "and", apply: "and ", boost: 5 },
      { label: "or", apply: "or ", boost: 3 },
      { label: "as", apply: "as ", boost: 1 },
    ];
    const defaultResult = [
      {
        label: "Press ENTER to submit",
        apply: () => onSubmit.current(),
        boost: 6,
      },
      ...operands,
    ];

    const withSaveAddReplace = [
      {
        label: "Submit (add to existing filter)",
        apply: () => onSubmit.current("add"),
        boost: 7,
      },
      {
        label: "Submit (replace existing filter)",
        apply: () => onSubmit.current("replace"),
        boost: 6,
      },
      ...operands,
    ];

    return {
      default: defaultResult,
      withSaveAddReplace,
    };
  }, [onSubmit]);

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

      console.log(`nodeBefore ${nodeBefore.name}`);
      switch (nodeBefore.name) {
        case "Filter":
          if (context.pos === 0) {
            const options = await suggestionProvider.getSuggestions("column");
            return { from: context.pos, options };
          } else {
            return {
              from: context.pos,
              options: existingFilter
                ? joinOperands.withSaveAddReplace
                : joinOperands.default,
            };
          }
        case "Identifier": {
          // TODO combine these
          const columnName = getColumnName(nodeBefore, state);
          const operator = getOperator(nodeBefore, state);
          const clauseOperator = getClauseOperator(nodeBefore, state);
          console.log(
            `operator = ${operator} clauseOperator ${clauseOperator}`
          );
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
          } else {
            const identifierIsColumn = word.text === columnName;
            const isPartialMatch = identifierIsColumn
              ? await suggestionProvider.isPartialMatch(
                  "column",
                  undefined,
                  word.text
                )
              : await suggestionProvider.isPartialMatch(
                  "columnValue",
                  columnName,
                  word.text
                );

            if (isPartialMatch && identifierIsColumn) {
              const options = await suggestionProvider.getSuggestions("column");
              return { from: nodeBefore?.parent?.from, options };
            } else if (columnName && !operator) {
              const options = await suggestionProvider.getSuggestions(
                "operator",
                columnName
              );
              return { from: nodeBefore.from, options };
            } else if (isPartialMatch) {
              const options = await suggestionProvider.getSuggestions(
                "columnValue",
                columnName
              );
              return { from: nodeBefore.from, options };
            } else {
              const options = await suggestionProvider.getSuggestions(
                "columnValue",
                columnName,
                word.text
              );
              return { from: nodeBefore.from, options };
            }
          }
        }
        case "ColumnSetExpression":
        case "Values":
          {
            const columnName = getColumnName(nodeBefore, state);
            const selection = getSetValues(nodeBefore, state);
            const options = await suggestionProvider.getSuggestions(
              "columnValue",
              columnName,
              undefined,
              selection
            );
            return { from: context.pos, options };
          }
          break;
        case "Comma":
        case "LBrack": {
          const columnName = getColumnName(nodeBefore, state);
          const options = await suggestionProvider.getSuggestions(
            "columnValue",
            columnName
          );
          return { from: context.pos, options };
        }

        case "ColumnValueExpression":
          {
            const lastToken = nodeBefore.lastChild?.prevSibling;

            switch (lastToken?.name) {
              case "Column": {
                const columnName = getColumnName(nodeBefore, state);
                const options = await suggestionProvider.getSuggestions(
                  "operator",
                  columnName
                );
                return { from: context.pos, options };
              }

              case "Operator": {
                const operator = getValue(lastToken, state);
                console.log({ operator });
                const columnName = getColumnName(lastToken, state);
                const options = await suggestionProvider.getSuggestions(
                  "columnValue",
                  columnName
                );
                return { from: context.pos, options };
              }
              default:
                console.log(
                  `what do we do with ColumnValueExpression whose lastToken = ${lastToken?.name}`
                );
            }
          }
          break;

        case "In": {
          return {
            from: context.pos,
            options: [{ label: "[", apply: " [", type: "text" }],
          };
        }

        case "Quote":
        case "Or":
        case "And":
        case "Eq":
          console.log(`we have a ${nodeBefore.name}`);
          break;
        case "AsClause":
          return {
            from: context.pos,
            options: [
              {
                label: "enter name for this filter",
                // apply: "and ",
                boost: 5,
              },
            ],
          };

        case "AndExpression":
        case "OrExpression": {
          const options = await suggestionProvider.getSuggestions("column");
          return { from: context.pos, options };
        }

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
    [
      existingFilter,
      joinOperands.default,
      joinOperands.withSaveAddReplace,
      onSubmit,
      suggestionProvider,
    ]
  ) as CompletionSource;
};
