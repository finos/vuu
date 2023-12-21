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
  VuuCompletion,
} from "@finos/vuu-codemirror";
import { walkTree } from "@finos/vuu-filter-parser";
import { Filter } from "@finos/vuu-filter-types";
import cx from "clsx";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { filterLanguageSupport } from "./FilterLanguage";
import { vuuHighlighting } from "./highlighting";
import { vuuTheme } from "./theme";
import {
  ApplyCompletion,
  FilterSubmissionMode,
  useAutoComplete,
} from "./useFilterAutoComplete";
import { FilterSaveOptions } from "./useFilterSuggestionProvider";

export type SuggestionType =
  | "column"
  | "columnValue"
  | "operator"
  | "save"
  | "name";

export interface FilterSuggestionOptions {
  quoted?: boolean;
  columnName?: string;
  existingFilter?: Filter;
  filterName?: string;
  onSubmit?: () => void;
  operator?: string;
  startsWith?: string;
  selection?: string[];
}

export type getFilterSuggestionsType = (
  suggestionType: SuggestionType,
  options?: FilterSuggestionOptions
) => Promise<Completion[]>;

export interface IFilterSuggestionProvider {
  getSuggestions: getFilterSuggestionsType;
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
  saveOptions?: FilterSaveOptions;
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
