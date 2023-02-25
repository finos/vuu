import {
  autocompletion,
  Completion,
  defaultKeymap,
  EditorState,
  EditorView,
  ensureSyntaxTree,
  keymap,
  startCompletion,
} from "@finos/vuu-codemirror";
import { createEl } from "@finos/vuu-utils";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { minimalSetup } from "./codemirror-basic-setup";
import { columnExpressionLanguageSupport } from "./column-language-parser";
import {
  Expression,
  walkTree,
} from "./column-language-parser/ColumnExpressionTreeWalker";
import { vuuHighlighting } from "./highlighting";
import { vuuTheme } from "./theme";
import {
  ApplyCompletion,
  useColumnAutoComplete,
} from "./useColumnAutoComplete";

export type ColumnExpressionOperator = "Times" | "Divide" | "Minus" | "Plus";

export type ColumnExpressionSuggestionType =
  | "column"
  | "columnValue"
  | "expression"
  | "condition-operator"
  | "operator";

export type ColumnExpressionSuggestionOptions = {
  columnName?: string;
  functionName?: string;
  operator?: ColumnExpressionOperator;
  prefix?: string;
  startsWith?: string;
  selection?: string[];
};

// TODO move this somewhere neutral
export interface IExpressionSuggestionProvider {
  getSuggestions: (
    valueType: ColumnExpressionSuggestionType,
    options?: ColumnExpressionSuggestionOptions
  ) => Promise<Completion[]>;
  isPartialMatch: (
    valueType: ColumnExpressionSuggestionType,
    columnName?: string,
    text?: string | undefined
  ) => Promise<boolean>;
}

export interface ExpressionSuggestionConsumer {
  suggestionProvider: IExpressionSuggestionProvider;
}

const getView = (ref: MutableRefObject<EditorView | undefined>): EditorView => {
  if (ref.current == undefined) {
    throw Error("EditorView not defined");
  }
  return ref.current;
};

const getOptionClass = (/*completion: Completion*/) => {
  return "vuuSuggestion";
};

const noop = () => console.log("noooop");

const hasExpressionType = (
  completion: Completion
): completion is Completion & { expressionType: string } =>
  "expressionType" in completion;

const injectOptionContent = (
  completion: Completion /*, state: EditorState*/
) => {
  if (hasExpressionType(completion)) {
    const div = createEl("div", "expression-type-container");
    const span = createEl("span", "expression-type", completion.expressionType);
    div.appendChild(span);
    return div;
  } else {
    return null;
  }
};

export interface ColumnExpressionEditorProps {
  onChange?: (source: string, expression: Expression | undefined) => void;
  onSubmitExpression?: (
    source: string,
    expression: Expression | undefined
  ) => void;
  suggestionProvider: IExpressionSuggestionProvider;
}

export const useColumnExpressionEditor = ({
  onChange,
  onSubmitExpression,
  suggestionProvider,
}: ColumnExpressionEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onSubmit = useRef<ApplyCompletion>(noop);
  const viewRef = useRef<EditorView>();
  const completionFn = useColumnAutoComplete(suggestionProvider, onSubmit);

  const [createState, clearInput] = useMemo(() => {
    const parseExpression = (): [string, Expression] | ["", undefined] => {
      const view = getView(viewRef);
      const source = view.state.doc.toString();
      const tree = ensureSyntaxTree(view.state, view.state.doc.length, 5000);
      if (tree) {
        const expression = walkTree(tree, source) as Expression;
        return [source, expression];
      } else {
        return ["", undefined];
      }
    };

    const clearInput = () => {
      getView(viewRef).setState(createState());
    };

    const submitExpressionAndClearInput = () => {
      const [source, expression] = parseExpression();
      onSubmitExpression?.(source, expression);
      clearInput();
    };

    const submitFilter = (key: string) => {
      return keymap.of([
        {
          key,
          run() {
            submitExpressionAndClearInput();
            return true;
          },
        },
      ]);
    };

    const showSuggestions = (key: string) => {
      return keymap.of([
        {
          key,
          run() {
            startCompletion(getView(viewRef));
            return true;
          },
        },
      ]);
    };

    const createState = (): EditorState =>
      EditorState.create({
        doc: "",
        extensions: [
          minimalSetup,
          autocompletion({
            addToOptions: [
              {
                render: injectOptionContent,
                position: 70,
              },
            ],
            override: [completionFn],
            optionClass: getOptionClass,
          }),
          columnExpressionLanguageSupport(),
          keymap.of(defaultKeymap),
          submitFilter("Ctrl-Enter"),
          showSuggestions("ArrowDown"),
          EditorView.updateListener.of((v) => {
            const view = getView(viewRef);
            if (v.docChanged) {
              startCompletion(view);
              const source = view.state.doc.toString();
              onChange?.(source, undefined);
            }
          }),
          // Enforces single line view
          // EditorState.transactionFilter.of((tr) =>
          //   tr.newDoc.lines > 1 ? [] : tr
          // ),
          vuuTheme,
          vuuHighlighting,
        ],
      });

    onSubmit.current = () => {
      submitExpressionAndClearInput();
      // TODO refocu sthe editor
      setTimeout(() => {
        getView(viewRef).focus();
      }, 100);
    };

    return [createState, clearInput];
  }, [completionFn, onChange, onSubmitExpression]);

  useEffect(() => {
    if (!editorRef.current) {
      throw Error("editor not in dom");
    }

    viewRef.current = new EditorView({
      state: createState(),
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
    };
  }, [completionFn, createState]);

  return { editorRef, clearInput };
};
