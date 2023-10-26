import {
  autocompletion,
  Completion,
  defaultKeymap,
  EditorState,
  EditorView,
  ensureSyntaxTree,
  keymap,
  minimalSetup,
  startCompletion,
} from "@finos/vuu-codemirror";
import { createEl } from "@finos/vuu-utils";
import {
  FocusEventHandler,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { columnExpressionLanguageSupport } from "./column-language-parser";
import {
  ColumnDefinitionExpression,
  walkTree,
} from "./column-language-parser/ColumnExpressionTreeWalker";
import { ColumnExpressionInputProps } from "./ColumnExpressionInput";
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
  | "operator"
  | "relational-operator";

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

export const useColumnExpressionEditor = ({
  onChange,
  onSubmitExpression,
  source,
  suggestionProvider,
}: ColumnExpressionInputProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onSubmitRef = useRef<ApplyCompletion>(noop);
  const viewRef = useRef<EditorView>();
  const completionFn = useColumnAutoComplete(suggestionProvider, onSubmitRef);

  const [createState, clearInput, submit] = useMemo(() => {
    const parseExpression = ():
      | [string, ColumnDefinitionExpression]
      | ["", undefined] => {
      const view = getView(viewRef);
      const source = view.state.doc.toString();
      const tree = ensureSyntaxTree(view.state, view.state.doc.length, 5000);
      if (tree) {
        const expression = walkTree(tree, source);
        return [source, expression];
      } else {
        return ["", undefined];
      }
    };

    const clearInput = () => {
      getView(viewRef).setState(createState());
    };

    const submitExpression = () => {
      const [source, expression] = parseExpression();
      onSubmitExpression?.(source, expression);
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
        doc: source,
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
          showSuggestions("ArrowDown"),
          EditorView.updateListener.of((v) => {
            const view = getView(viewRef);
            if (v.docChanged) {
              startCompletion(view);
              const source = view.state.doc.toString();
              onChange?.(source);
            }
          }),
          // Enforces single line view
          EditorState.transactionFilter.of((tr) =>
            tr.newDoc.lines > 1 ? [] : tr
          ),
          vuuTheme,
          vuuHighlighting,
        ],
      });

    onSubmitRef.current = () => {
      submitExpression();
    };

    return [createState, clearInput, submitExpression];
  }, [completionFn, onChange, onSubmitExpression, source]);

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

  const handleBlur = useCallback<FocusEventHandler>(() => {
    submit();
  }, [submit]);

  return { editorRef, clearInput, onBlur: handleBlur };
};
