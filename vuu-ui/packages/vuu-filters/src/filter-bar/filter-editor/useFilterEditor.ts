import { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-context-menu";
import { getColumnsByName } from "@vuu-ui/vuu-utils";
import {
  KeyboardEventHandler,
  RefCallback,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { FilterClauseCancelHandler } from "../filter-clause";
import {
  focusFilterClauseField,
  focusFirstClauseIfAllClausesValid,
  focusLastClauseValue,
  getFocusedFieldDetails,
  navigateToNextFilterClause,
} from "../filter-clause/filterClauseFocusManagement";
import {
  FilterChangeHandler,
  FilterModel,
  FilterStatusChangeHandler,
} from "../FilterModel";
import { FilterClauseCombinatorChangeHandler } from "./FilterClauseCombinator";
import { FilterEditorProps } from "./FilterEditor";

export type FilterEditorHookProps = Pick<
  FilterEditorProps,
  "columnDescriptors" | "filter" | "onCancel" | "onSave"
>;

export const useFilterEditor = ({
  columnDescriptors,
  filter,
  onCancel,
  onSave,
}: FilterEditorHookProps) => {
  const filterModel = useMemo(() => new FilterModel(filter), [filter]);

  const [, forceRefresh] = useReducer((n: number) => n + 1, 0);
  const saveButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainer = useCallback<RefCallback<HTMLDivElement>>((el) => {
    containerRef.current = el;
    if (el) {
      // If there is a new empty clause it will focus itself, otw ...
      focusFirstClauseIfAllClausesValid(el);
    }
  }, []);

  // Once a filter has a combinator, a new clause can only be added with
  // that same combinator. Changing it is done with the combinator button.
  const saveButtonMenuBuilder = useCallback<MenuBuilder>(
    (_, options) => {
      switch (filterModel.op) {
        case "and":
          return [{ id: "and-clause", label: "AND", options }];
        case "or":
          return [{ id: "or-clause", label: "OR", options }];
        default:
          return [
            { id: "and-clause", label: "AND", options },
            { id: "or-clause", label: "OR", options },
          ];
      }
    },
    [filterModel],
  );

  const columnsByName = useMemo(
    () => getColumnsByName(columnDescriptors),
    [columnDescriptors],
  );

  const focusSaveButton = useCallback(() => {
    requestAnimationFrame(() => {
      saveButtonRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const isLastFilterClause = (index?: number) =>
      index !== undefined && filterModel.filterClauses.length === index + 1;

    // Save button enabled state is read from the model, re-render when it changes
    const handleValidStatusChange: FilterStatusChangeHandler = () =>
      forceRefresh();

    const handleFilterChange: FilterChangeHandler = (_filter, isValid) => {
      if (isValid) {
        const [filterClauseIndex, fieldName] = getFocusedFieldDetails();
        if (fieldName === "value" && isLastFilterClause(filterClauseIndex)) {
          focusSaveButton();
        }
      }
    };
    filterModel.on("isValid", handleValidStatusChange);
    filterModel.on("filter", handleFilterChange);
    return () => {
      filterModel.removeListener("isValid", handleValidStatusChange);
      filterModel.removeListener("filter", handleFilterChange);
    };
  }, [filterModel, focusSaveButton]);

  const handleCancelFilterClause = useCallback<FilterClauseCancelHandler>(
    (filterClause, reason) => {
      if (reason === "Backspace") {
        const indexOfFilterClause =
          filterModel.filterClauses.indexOf(filterClause);
        filterModel.removeFilterClause(filterClause);
        forceRefresh();
        if (containerRef.current && indexOfFilterClause > 0) {
          focusFilterClauseField(containerRef.current, indexOfFilterClause - 1);
        }
      } else {
        onCancel(filter);
      }
    },
    [filter, filterModel, onCancel],
  );

  const invokeMenuAction = useCallback<MenuActionHandler>(
    (menuId) => {
      switch (menuId) {
        case "save": {
          const savedFilter = filterModel.asFilter();
          const newOrUpdatedFilter = filter?.name
            ? {
                ...savedFilter,
                name: filter.name,
              }
            : savedFilter;
          onSave(newOrUpdatedFilter);
          return true;
        }
        case "and-clause":
          filterModel.addNewFilterClause("and");
          forceRefresh();
          return true;
        case "or-clause":
          filterModel.addNewFilterClause("or");
          forceRefresh();
          return true;
        default:
          return false;
      }
    },
    [filter?.name, filterModel, onSave],
  );

  const handleKeyDownSaveButton = useCallback<KeyboardEventHandler>(
    (evt) => {
      if (evt.key === "Tab" && evt.shiftKey) {
        evt.preventDefault();
        const target = evt.target as HTMLElement;
        const filterEditor = target.closest(".vuuFilterEditor") as HTMLElement;
        focusLastClauseValue(filterEditor);
      } else if (evt.key === "Escape") {
        onCancel(filter);
      }
    },
    [filter, onCancel],
  );

  const handleKeyDownNavigationFromCombinator = useCallback<
    KeyboardEventHandler<HTMLElement>
  >((evt) => {
    const { target, key, shiftKey } = evt;
    if (key === "ArrowLeft" || (key === "Tab" && shiftKey)) {
      evt.preventDefault();
      navigateToNextFilterClause(target as HTMLElement, "bwd");
    } else if (key === "ArrowRight") {
      evt.preventDefault();
      navigateToNextFilterClause(target as HTMLElement, "fwd");
    }
  }, []);

  const handleClickSaveButton = useCallback(
    () => invokeMenuAction("save"),
    [invokeMenuAction],
  );

  const saveButtonProps = {
    PopupMenuProps: {
      icon: "more-vert",
      menuBuilder: saveButtonMenuBuilder,
      menuActionHandler: invokeMenuAction,
      menuLocation: "filter-save-menu",
    },
    onClick: handleClickSaveButton,
    onKeyDown: handleKeyDownSaveButton,
  };

  const onChangeFilterCombinator =
    useCallback<FilterClauseCombinatorChangeHandler>(
      (op) => {
        filterModel.setOp(op);
        forceRefresh();
      },
      [filterModel],
    );

  const handleCancelFilterEdit = useCallback(() => {
    onCancel(filter);
  }, [filter, onCancel]);

  return {
    columnsByName,
    filterModel,
    focusSaveButton,
    onCancelFilterClause: handleCancelFilterClause,
    onCancelFilterEdit: handleCancelFilterEdit,
    onChangeFilterCombinator,
    onKeyDownCombinator: handleKeyDownNavigationFromCombinator,
    saveButtonProps,
    saveButtonRef,
    setContainer,
  };
};
