import { defaultKeymap } from "@codemirror/commands";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { Filter } from "@vuu-ui/vuu-filters";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { minimalSetup } from "./codemirror-basic-setup";
import { filterLanguageSupport } from "./filter-language-parser";
import { vuuHighlighting } from "./highlighting";
import { vuuTheme } from "./theme";
import { walkTree } from "./filter-language-parser/walkTree";
import {
  autocompletion,
  Completion,
  startCompletion,
} from "@codemirror/autocomplete";
import { ApplyCompletion, useAutoComplete } from "./useFilterAutoComplete";

export type SuggestionType = "column" | "columnValue" | "operator";

// TODO move this somewhere neutral
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

export interface SuggestionConsumer {
  suggestionProvider: ISuggestionProvider;
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

const stripName = (filterQuery: string) => {
  const pos = filterQuery.lastIndexOf(" as ");
  if (pos !== -1) {
    return filterQuery.slice(0, pos);
  } else {
    return filterQuery;
  }
};

const noop = () => console.log("noooop");

export interface CodeMirrorEditorProps {
  existingFilter?: Filter;
  onSubmitFilter?: (
    filter: Filter | undefined,
    filterQuery: string,
    filterName?: string,
    mode?: "add" | "replace"
  ) => void;
  suggestionProvider: ISuggestionProvider;
}

export const useCodeMirrorEditor = ({
  existingFilter,
  onSubmitFilter,
  suggestionProvider,
}: CodeMirrorEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onSubmit = useRef<ApplyCompletion>(noop);
  const viewRef = useRef<EditorView>();
  const completionFn = useAutoComplete(
    suggestionProvider,
    onSubmit,
    existingFilter
  );

  const [createState, clearInput] = useMemo(() => {
    const parseFilter = ():
      | [Filter, string, string | undefined]
      | [undefined, "", undefined] => {
      const view = getView(viewRef);
      const source = view.state.doc.toString();
      const tree = ensureSyntaxTree(view.state, view.state.doc.length, 5000);
      if (tree) {
        const filter = walkTree(tree, source);
        return [filter.toJson(), stripName(source), filter.name];
      } else {
        return [undefined, "", undefined];
      }
    };

    const clearInput = () => {
      getView(viewRef).setState(createState());
    };

    const submitFilterAndClearInput = (mode?: "add" | "replace") => {
      const [filter, filterQuery, filterName] = parseFilter();
      onSubmitFilter?.(filter, filterQuery, filterName, mode);
      clearInput();
    };

    const submitFilter = (key: string) => {
      return keymap.of([
        {
          key,
          run() {
            submitFilterAndClearInput();
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
            override: [completionFn],
            optionClass: getOptionClass,
          }),
          filterLanguageSupport(),
          keymap.of(defaultKeymap),
          submitFilter("Ctrl-Enter"),
          showSuggestions("ArrowDown"),
          EditorView.updateListener.of((v) => {
            const view = getView(viewRef);
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

    onSubmit.current = (mode?: "add" | "replace") => {
      submitFilterAndClearInput(mode);
      // TODO refocu sthe editor
      setTimeout(() => {
        getView(viewRef).focus();
      }, 100);
    };

    return [createState, clearInput];
  }, [completionFn, onSubmitFilter]);

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
