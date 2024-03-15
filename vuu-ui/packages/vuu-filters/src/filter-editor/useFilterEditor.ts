import { MenuActionHandler } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { ColumnDescriptorsByName } from "packages/vuu-filter-types";
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
import { FilterChangeHandler, FilterStatusChangeHandler } from "../FilterModel";
import { FilterClauseCancelHandler } from "../filter-clause";

export interface FilterEditorHookProps
  extends Pick<
    FilterEditorProps,
    "columnDescriptors" | "filterModel" | "onCancel" | "onSave"
  > {
  label?: string;
}

export const useFilterEditor = ({
  columnDescriptors,
  filterModel,
  onCancel,
  onSave,
}: FilterEditorHookProps) => {
  const [_, forceRefresh] = useState({});
  const [isValid, setIsValid] = useState(filterModel.isValid);
  const saveButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainer = useCallback<RefCallback<HTMLDivElement>>((el) => {
    containerRef.current = el;
    if (el) {
      // If there is a new empty clause it will focus itself, otw ...
      focusFirstClauseIfAllClausesValid(el);
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
        onCancel();
      }
    },
    [filterModel, onCancel]
  );

  const handleMenuAction = useCallback<MenuActionHandler>(
    ({ menuId }) => {
      switch (menuId) {
        case "save": {
          onSave(filterModel.asFilter());
          return true;
        }
        case "and-clause": {
          filterModel.addNewFilterClause("and");
          return true;
        }
        case "or-clause":
          filterModel.addNewFilterClause("or");
          return true;
        default:
          return false;
      }
    },
    [filterModel, onSave]
  );

  const handleKeyDownMenu = useCallback<KeyboardEventHandler>((evt) => {
    if (evt.key === "Tab" && evt.shiftKey) {
      evt.preventDefault();
      const target = evt.target as HTMLElement;
      const filterEditor = target.closest(".vuuFilterEditor") as HTMLElement;
      focusLastClauseValue(filterEditor);
    }
  }, []);

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

  return {
    columnsByName,
    isValid,
    onCancelFilterClause: handleCancelFilterClause,
    onKeyDownCombinator: handleKeyDownNavigationFromCombinator,
    onKeyDownMenu: handleKeyDownMenu,
    onMenuAction: handleMenuAction,
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
