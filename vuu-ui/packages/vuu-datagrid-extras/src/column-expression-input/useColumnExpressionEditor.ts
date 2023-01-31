import {
  autocompletion,
  Completion,
  startCompletion,
} from "@codemirror/autocomplete";
import { defaultKeymap } from "@codemirror/commands";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { createEl } from "@finos/vuu-utils";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { minimalSetup } from "./codemirror-basic-setup";
import { columnExpressionLanguageSupport } from "./column-language-parser";
import { Expression } from "./column-language-parser/Expression";
import { walkExpressionTree } from "./column-language-parser/walkExpressionTree";
import { vuuHighlighting } from "./highlighting";
import { vuuTheme } from "./theme";
import {
  ApplyCompletion,
  useColumnAutoComplete,
} from "./useColumnAutoComplete";

export type ColumnExpressionSuggestionType =
  | "column"
  | "expression"
  | "operator";

// TODO move this somewhere neutral
export interface IExpressionSuggestionProvider {
  getSuggestions: (
    valueType: ColumnExpressionSuggestionType,
    options?: {
      columnName?: string;
      filterNameName?: string;
      startsWith?: string;
      selection?: string[];
    }
  ) => Promise<Completion[]>;
  isPartialMatch: (
    valueType: ColumnExpressionSuggestionType,
    columnName?: string,
    text?: string | undefined
  ) => Promise<boolean>;
}

export interface SuggestionConsumer2 {
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

const injectOptionContent = (completion: Completion, state: EditorState) => {
  if (hasExpressionType(completion)) {
    const div = createEl("div", "steve-type");
    const span = createEl("span", "expression-type", completion.expressionType);
    div.appendChild(span);
    return div;
  } else {
    return null;
  }
};

export interface ColumnExpressionEditorProps {
  onSubmitExpression?: (
    expression: Expression | undefined,
    source: string
  ) => void;
  suggestionProvider: ISuggestionProvider2;
}

export const useColumnExpressionEditor = ({
  onSubmitExpression,
  suggestionProvider,
}: ColumnExpressionEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onSubmit = useRef<ApplyCompletion>(noop);
  const viewRef = useRef<EditorView>();
  const completionFn = useColumnAutoComplete(suggestionProvider, onSubmit);

  const [createState, clearInput] = useMemo(() => {
    const parseExpression = (): [Expression, string] | [undefined, ""] => {
      const view = getView(viewRef);
      const source = view.state.doc.toString();
      const tree = ensureSyntaxTree(view.state, view.state.doc.length, 5000);
      if (tree) {
        const expression = walkExpressionTree(tree, source);
        return [expression, source];
      } else {
        return [undefined, ""];
      }
    };

    const clearInput = () => {
      getView(viewRef).setState(createState());
    };

    const submitExpressionAndClearInput = () => {
      const [expression, source] = parseExpression();
      onSubmitExpression?.(expression, source);
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
            }
          }),
          EditorState.transactionFilter.of((tr) =>
            tr.newDoc.lines > 1 ? [] : tr
          ),
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
  }, [completionFn, onSubmitExpression]);

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
