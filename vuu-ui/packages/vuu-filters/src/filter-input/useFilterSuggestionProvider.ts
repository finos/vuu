import {
  asNameSuggestion,
  booleanJoinSuggestions,
  Completion,
  getNamePrompt,
  numericOperators,
  stringOperators,
  toSuggestions,
} from "@finos/vuu-codemirror";
import {
  getTypeaheadParams,
  SuggestionFetcher,
  useTypeaheadSuggestions,
} from "@finos/vuu-data-react";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { Filter } from "@finos/vuu-filter-types";
import { VuuTable } from "@finos/vuu-protocol-types";
// import { isMappedValueTypeRenderer, isTypeDescriptor } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import { filterInfo } from "./filterInfo";
import {
  IFilterSuggestionProvider,
  SuggestionType,
} from "./useCodeMirrorEditor";
import { ApplyCompletion } from "./useFilterAutoComplete";

const NO_NAMED_FILTERS = [] as Completion[];
const NONE = {};

const saveAsTab = (onSubmit: ApplyCompletion) => [
  {
    label: "Press ENTER to create TAB",
    apply: () => onSubmit("tab"),
    boost: 6,
  },
];

const makeSaveOrExtendSuggestions = (
  onSubmit: ApplyCompletion,
  existingFilter?: Filter,
  withJoinSuggestions = true
) => {
  const result = existingFilter
    ? ([
        {
          label: "REPLACE existing filter",
          apply: () => onSubmit("replace"),
          boost: 8,
        },
        {
          label: "AND existing filter",
          apply: () => onSubmit("and"),
          boost: 7,
        },
        {
          label: "OR existing filter",
          apply: () => onSubmit("or"),
          boost: 7,
        },
      ] as Completion[])
    : ([
        {
          label: "Press ENTER to submit",
          apply: () => onSubmit(),
          boost: 6,
        },
      ] as Completion[]);

  return withJoinSuggestions
    ? result.concat(booleanJoinSuggestions).concat(asNameSuggestion)
    : result;
};

const promptToSaveOrExtend = (
  onSubmit: ApplyCompletion,
  existingFilter?: Filter
) => makeSaveOrExtendSuggestions(onSubmit, existingFilter, true);

const promptToSave = (onSubmit: ApplyCompletion) =>
  makeSaveOrExtendSuggestions(onSubmit, undefined);

const getSaveSuggestions = ({
  existingFilter,
  filterName,
  onSubmit,
  saveOptions,
}: {
  existingFilter?: Filter;
  filterName?: string;
  onSubmit: () => void;
  saveOptions: FilterSaveOptions;
}) => {
  const includeTabSuggestion = filterName && saveOptions.allowSaveAsTab;
  const result = existingFilter
    ? promptToSaveOrExtend(onSubmit, existingFilter)
    : promptToSave(onSubmit);

  if (includeTabSuggestion) {
    return result.concat(saveAsTab(onSubmit));
  } else {
    return result;
  }
};

const suggestColumns = (columns: ColumnDescriptor[]) =>
  columns.map((column) => ({
    boost: 5,
    label: column.name,
  }));

const suggestNamedFilters = (namedFilters?: Map<string, string>) =>
  namedFilters
    ? (Array.from(namedFilters.entries()).map(([filterName, filterQuery]) => ({
        info: () => filterInfo(filterName, filterQuery),
        label: filterName,
        type: "filter",
      })) as Completion[])
    : NO_NAMED_FILTERS;

const doneCommand: Completion = {
  label: "Done",
  apply: "] ",
  type: "keyword",
  boost: 10,
};

const withApplySpace = (
  suggestions: Completion[],
  startsWith = ""
): Completion[] =>
  suggestions
    .filter((sugg) => startsWith === "" || sugg.label.startsWith(startsWith))
    .map((suggestion) => ({
      ...suggestion,
      apply: suggestion.label + " ",
    }));

export type FilterSaveOptions = {
  allowSaveAsTab?: boolean;
  allowReplace?: boolean;
};
export interface SuggestionProviderHookProps {
  columns: ColumnDescriptor[];
  namedFilters?: Map<string, string>;
  saveOptions?: FilterSaveOptions;
  table: VuuTable;
  typeaheadHook?: () => SuggestionFetcher;
}

const defaultSaveOptions = {
  allowReplace: true,
};

export const useFilterSuggestionProvider = ({
  columns,
  namedFilters,
  saveOptions = defaultSaveOptions,
  table,
  typeaheadHook: useTypeahead = useTypeaheadSuggestions,
}: SuggestionProviderHookProps): IFilterSuggestionProvider => {
  const latestSuggestionsRef = useRef<Completion[]>();
  const getTypeaheadSuggestions = useTypeahead();
  const getSuggestions: IFilterSuggestionProvider["getSuggestions"] =
    useCallback(
      async (suggestionType, options = NONE): Promise<Completion[]> => {
        const {
          columnName,
          existingFilter,
          filterName,
          operator,
          quoted: autoQuoted,
          onSubmit,
          startsWith,
          selection,
        } = options;

        switch (suggestionType) {
          case "operator":
            {
              const column = columns.find((col) => col.name === columnName);
              if (column) {
                switch (column.serverDataType) {
                  case "string":
                  case "char":
                    return withApplySpace(stringOperators, startsWith);
                  case "int":
                  case "long":
                  case "double":
                    return withApplySpace(numericOperators);
                }
              } else {
                console.warn(`'${columnName}' does not match any column name`);
              }
            }
            break;
          case "column": {
            const columnSuggestions = await suggestColumns(columns);
            const filterSuggestions = await suggestNamedFilters(namedFilters);
            return (latestSuggestionsRef.current =
              withApplySpace(columnSuggestions)).concat(
              withApplySpace(filterSuggestions)
            );
          }
          case "columnValue":
            {
              if (columnName) {
                const column = columns.find((col) => col.name === columnName);
                if (!column) {
                  throw Error(
                    `useFilterSUggestionProvider no column ${columnName}`
                  );
                }
                const prefix = Array.isArray(selection)
                  ? selection.length === 0
                    ? "["
                    : ","
                  : "";
                const params = getTypeaheadParams(
                  table,
                  columnName,
                  startsWith
                );
                const suggestions = await getTypeaheadSuggestions(params);
                // const { type } = column;
                // if (
                //   isTypeDescriptor(type) &&
                //   isMappedValueTypeRenderer(type?.renderer)
                // ) {
                //   const { map } = type.renderer;
                //   suggestions = suggestions.map((value) => map[value] ?? value);
                // }

                // prob don't want to save the prefix
                const isIllustration = operator === "starts";
                latestSuggestionsRef.current = toSuggestions(suggestions, {
                  moveCursorToEnd: autoQuoted,
                  quoted: column?.serverDataType === "string" && !autoQuoted,
                  suffix: autoQuoted ? "" : " ",
                  prefix: isIllustration ? startsWith : prefix,
                  isIllustration,
                });
                if (Array.isArray(selection) && selection?.length > 1) {
                  return [doneCommand, ...latestSuggestionsRef.current];
                }
                return latestSuggestionsRef.current;
              }
            }
            break;
          case "save": {
            if (typeof onSubmit !== "function") {
              throw Error(
                "useFilterSuggestionProvider, onSubmit must be supplied for 'save' suggestions"
              );
            }
            return await getSaveSuggestions({
              existingFilter,
              filterName,
              onSubmit,
              saveOptions,
            });
          }
          case "name":
            return await getNamePrompt("filter");
          default:
        }

        return [];
      },
      [columns, getTypeaheadSuggestions, namedFilters, saveOptions, table]
    );

  const isPartialMatch = useCallback(
    async (
      valueType: SuggestionType,
      columnName?: string,
      pattern?: string
    ) => {
      // const { current: latestSuggestions } = latestSuggestionsRef;
      const suggestions =
        // latestSuggestions && latestSuggestions.length > 0
        //   ? latestSuggestions
        await getSuggestions(valueType, { columnName });

      if (pattern && suggestions) {
        for (const option of suggestions) {
          if (option.label === pattern) {
            return false;
          } else if (option.label.startsWith(pattern)) {
            return true;
          }
        }
      }
      return false;
    },
    [getSuggestions]
  );

  return {
    getSuggestions,
    isPartialMatch,
  };
};
