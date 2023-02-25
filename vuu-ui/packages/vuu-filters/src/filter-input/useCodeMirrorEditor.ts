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
import { Filter } from "@finos/vuu-filter-types";
import cx from "classnames";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { minimalSetup } from "./codemirror-basic-setup";
import { filterLanguageSupport } from "./filter-language-parser";
import { walkTree } from "./filter-language-parser/FilterTreeWalker";
import { vuuHighlighting } from "./highlighting";
import { vuuTheme } from "./theme";
import {
  ApplyCompletion,
  FilterSubmissionMode,
  useAutoComplete,
} from "./useFilterAutoComplete";
import { VuuCompletion } from "./useFilterSuggestionProvider";

export type SuggestionType = "column" | "columnValue" | "operator";

export interface SuggestionOptions {
  columnName?: string;
  operator?: string;
  startsWith?: string;
  selection?: string[];
}

export type getSuggestionsType = (
  suggestionType: SuggestionType,
  options?: SuggestionOptions
) => Promise<Completion[]>;

export interface IFilterSuggestionProvider {
  getSuggestions: getSuggestionsType;
  isPartialMatch: (
    valueType: SuggestionType,
    columnName?: string,
    text?: string | undefined
  ) => Promise<boolean>;
}

export interface SuggestionConsumer {
  suggestionProvider: IFilterSuggestionProvider;
}

const getView = (ref: MutableRefObject<EditorView | undefined>): EditorView => {
  if (ref.current == undefined) {
    throw Error("EditorView not defined");
  }
  return ref.current;
};

const getOptionClass = (completion: VuuCompletion) => {
  return cx("vuuSuggestion", {
    vuuIllustration: completion.isIllustration,
  });
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

export type filterSubmissionHandler = (
  filter: Filter | undefined,
  filterQuery: string,
  mode?: FilterSubmissionMode,
  filterName?: string
) => void;

export interface CodeMirrorEditorProps {
  existingFilter?: Filter;
  onSubmitFilter?: filterSubmissionHandler;
  suggestionProvider: IFilterSuggestionProvider;
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
        const filter = walkTree(tree, source) as Filter;
        return [filter, stripName(source), filter.name];
      } else {
        return [undefined, "", undefined];
      }
    };

    const clearInput = () => {
      getView(viewRef).setState(createState());
    };

    const submitFilterAndClearInput = (mode?: FilterSubmissionMode) => {
      const [filter, filterQuery, filterName] = parseFilter();
      onSubmitFilter?.(filter, filterQuery, mode, filterName);
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

    onSubmit.current = (mode?: FilterSubmissionMode) => {
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
