import {
  autocompletion,
  Completion,
  startCompletion,
} from "@codemirror/autocomplete";
import { defaultKeymap } from "@codemirror/commands";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { HTMLAttributes, useEffect, useRef } from "react";
import { minimalSetup } from "./codemirror-basic-setup";
import { useAutoComplete } from "./useFilterAutoComplete";
import { walkTree } from "./walkTree";
import { vuuTheme } from "./theme";
import { vuuHighlighting } from "./highlighting";
import { filterLanguageSupport } from "./FilterLanguage";

import "./ParsedInput.css";

// const strictParser = parser.configure({ strict: true });

export type SuggestionType = "column" | "columnValue" | "operator";
export interface ISuggestionProvider {
  getSuggestions: (
    valueType: SuggestionType,
    columnName?: string,
    startsWith?: string,
    selection?: string[]
  ) => Promise<Completion[]>;
  isPartialMatch: (
    valueType: SuggestionType,
    columnName?: string,
    text?: string | undefined
  ) => Promise<boolean>;
}

export interface ParsedInputProps extends HTMLAttributes<HTMLDivElement> {
  suggestionProvider: ISuggestionProvider;
}

const getOptionClass = (/*completion: Completion*/) => {
  return "vuuSuggestion";
};

export const ParsedInput = ({ suggestionProvider }: ParsedInputProps) => {
  const completionFn = useAutoComplete(suggestionProvider);
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor.current) {
      throw Error("editor not in dom");
    }

    function submitFilter(key: string) {
      return keymap.of([
        {
          key,
          run() {
            const source = view.state.doc.toString();
            const tree = ensureSyntaxTree(
              view.state,
              view.state.doc.length,
              5000
            );
            if (tree) {
              const filter = walkTree(tree, source);
              console.log(`filerQuery ${source}`);
              console.log({ filter: filter.toJson() });
              view.setState(createState());
            }
            return true;
          },
        },
      ]);
    }

    const createState = (): EditorState =>
      EditorState.create({
        doc: "",
        extensions: [
          minimalSetup,
          autocompletion({
            override: [completionFn],
            optionClass: getOptionClass,
          }),
          filterLanguageSupport(),
          keymap.of(defaultKeymap),
          submitFilter("Ctrl-Enter"),
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              console.log(`>>>> ${view.state.doc.toString()}`);
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

    const view = new EditorView({
      state: createState(),
      parent: editor.current,
    });

    return () => {
      view.destroy();
    };
  }, [completionFn]);

  return (
    <div
      className="vuuFilterEditor"
      ref={editor}
      style={{ width: 600, height: 32 }}
    />
  );
};
