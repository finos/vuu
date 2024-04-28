import type { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import type {
  ColumnDescriptorsByName,
  FilterCombinatorOp,
} from "@finos/vuu-filter-types";
import {
  KeyboardEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  focusFilterClauseField,
  focusFirstClauseIfAllClausesValid,
  focusLastClauseValue,
  getFocusedFieldDetails,
  navigateToNextFilterClause,
} from "../filter-clause/filterClauseFocusManagement";
import { FilterEditorProps } from "./FilterEditor";
import {
  FilterChangeHandler,
  FilterModel,
  FilterStatusChangeHandler,
} from "../FilterModel";
import { FilterClauseCancelHandler } from "../filter-clause";
import { FilterClauseCombinatorChangeHandler } from "./FilterClauseCombinator";

export interface FilterEditorHookProps
  extends Pick<
    FilterEditorProps,
    "columnDescriptors" | "filter" | "onCancel" | "onSave"
  > {
  label?: string;
}

export const useFilterEditor = ({
  columnDescriptors,
  filter,
  onCancel,
  onSave,
}: FilterEditorHookProps) => {
  const filterModel = useMemo(() => {
    return new FilterModel(filter);
  }, [filter]);

  const [_, forceRefresh] = useState({});
  const [isValid, setIsValid] = useState(filterModel.isValid);
  const clauseCombinatorRef = useRef<FilterCombinatorOp | undefined>(undefined);
  const saveButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainer = useCallback<RefCallback<HTMLDivElement>>((el) => {
    containerRef.current = el;
    if (el) {
      // If there is a new empty clause it will focus itself, otw ...
      focusFirstClauseIfAllClausesValid(el);
    }
  }, []);

  const saveButtonMenuBuilder: MenuBuilder = useCallback((_, options) => {
    switch (clauseCombinatorRef.current) {
      case "and":
        return [{ action: "and-clause", label: "AND", options }];
      case "or":
        return [{ action: "or-clause", label: "OR", options }];
      default:
        return [
          { action: "and-clause", label: "AND", options },
          { action: "or-clause", label: "OR", options },
        ];
    }
  }, []);

  const columnsByName = useMemo(
    () => columnDescriptorsByName(columnDescriptors),
    [columnDescriptors]
  );

  const isLastFilterClause = useCallback(
    (index?: number) =>
      index !== undefined && filterModel.filterClauses.length === index + 1,
    [filterModel]
  );

  useMemo(() => {
    const setValid: FilterStatusChangeHandler = (isValid) => {
      // bind the model state change to React state to ensure render
      setIsValid(isValid);
    };

    const valueChanged: FilterChangeHandler = (_filter, isValid) => {
      if (isValid) {
        const [filterClauseIndex, fieldName] = getFocusedFieldDetails();
        if (fieldName === "value" && isLastFilterClause(filterClauseIndex)) {
          requestAnimationFrame(() => {
            saveButtonRef.current?.focus();
          });
        }
      }
    };
    filterModel.on("isValid", setValid);
    filterModel.on("filter", valueChanged);
  }, [filterModel, isLastFilterClause]);

  const handleCancelFilterClause = useCallback<FilterClauseCancelHandler>(
    (filterClause, reason) => {
      if (reason === "Backspace") {
        const indexOfFilterClause =
          filterModel.filterClauses.indexOf(filterClause);
        filterModel.removeFilterClause(filterClause);
        forceRefresh({});
        if (reason === "Backspace" && containerRef.current) {
          if (indexOfFilterClause > 0) {
            focusFilterClauseField(
              containerRef.current,
              indexOfFilterClause - 1
            );
          }
        }
      } else {
        console.log(
          `cancel because of Escape valid clause ${filterClause.isValid}`
        );
        onCancel(filter);
      }
    },
    [filter, filterModel, onCancel]
  );

  const invokeMenuAction = useCallback<MenuActionHandler>(
    ({ menuId }) => {
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
        case "and-clause": {
          clauseCombinatorRef.current = "and";
          filterModel.addNewFilterClause("and");
          return true;
        }
        case "or-clause":
          clauseCombinatorRef.current = "or";
          filterModel.addNewFilterClause("or");
          return true;
        default:
          return false;
      }
    },
    [filter?.name, filterModel, onSave]
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
    [filter, onCancel]
  );

  const handleKeyDownNavigationFromCombinator = useCallback<
    KeyboardEventHandler<HTMLElement>
  >((evt) => {
    const { target, key, shiftKey } = evt;
    if (key === "ArrowLeft") {
      evt.preventDefault();
      navigateToNextFilterClause(target as HTMLElement, "bwd");
    } else if (key === "ArrowRight") {
      evt.preventDefault();
      navigateToNextFilterClause(target as HTMLElement, "fwd");
    } else if (key === "Tab" && shiftKey) {
      evt.preventDefault();
      navigateToNextFilterClause(target as HTMLElement, "bwd");
    }
  }, []);

  const handleClickSaveButton = useMemo(
    () => () =>
      invokeMenuAction({
        menuId: "save",
        options: {},
        type: "menu-action",
      }),
    [invokeMenuAction]
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
        clauseCombinatorRef.current = op;
        forceRefresh({});
      },
      [filterModel]
    );

  const handleCancelFilterEdit = useCallback(() => {
    onCancel(filter);
  }, [filter, onCancel]);

  return {
    columnsByName,
    filterModel,
    isValid,
    onCancelFilterClause: handleCancelFilterClause,
    onCancelFilterEdit: handleCancelFilterEdit,
    onChangeFilterCombinator,
    onKeyDownCombinator: handleKeyDownNavigationFromCombinator,
    saveButtonProps,
    saveButtonRef,
    setContainer,
  };
};

// Duplicated in useFilterBar
function columnDescriptorsByName(
  columns: ColumnDescriptor[]
): ColumnDescriptorsByName {
  return columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
}
