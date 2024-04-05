import { FilterClause, FilterClauseOp } from "@finos/vuu-filter-types";
import {
  FocusEventHandler,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clauseIsNotFirst,
  focusNextElement,
  focusNextFocusableElement,
  elementIsFilterClause,
  navigateToNextItemIfAtBoundary,
  focusField,
  tabToPreviousFilterCombinator,
} from "./filterClauseFocusManagement";
import { FilterClauseProps } from "./FilterClause";
export type FilterClauseEditorHookProps = Pick<
  FilterClauseProps,
  "columnsByName" | "filterClauseModel" | "onCancel"
>;

export type FilterClauseValueChangeHandler = (
  value: string | string[] | number | number[],
  isFinal?: boolean
) => void;

export const useFilterClause = ({
  filterClauseModel,
  onCancel,
  columnsByName,
}: FilterClauseEditorHookProps) => {
  const [filterClause, setFilterClause] = useState<Partial<FilterClause>>(
    filterClauseModel.isValid ? filterClauseModel.asFilter() : {}
  );

  useMemo(() => {
    filterClauseModel.on("filterClause", (filterClause) => {
      setFilterClause(filterClause);
    });
  }, [filterClauseModel]);

  const columnRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);

  const removeAndNavigateToNextInputIfAtBoundary = useCallback(
    (evt: KeyboardEvent) => {
      const input = evt.target as HTMLInputElement;
      if (input.value === "") {
        const field = input.closest("[data-field]") as HTMLElement;
        switch (field?.dataset?.field) {
          case "operator": {
            filterClauseModel.column = undefined;
            focusNextFocusableElement("bwd");
            break;
          }
          case "value": {
            filterClauseModel.setOp(undefined);
            focusNextFocusableElement("bwd");
            break;
          }
          case "column": {
            if (clauseIsNotFirst(input)) {
              // When we backspace from an empty clause, the clause will be removed.filterClause
              // In this case, we will reposition focus on previous clause, but we
              // don't want the backspace to be effect an edit on that clause.
              evt.preventDefault();
              onCancel?.(filterClauseModel, "Backspace");
            }
          }
        }
      }
    },
    [filterClauseModel, onCancel]
  );

  const onSelectColumn = (evt: SyntheticEvent, selectedColumn: string) => {
    if (selectedColumn) {
      if (evt?.type === "keydown") {
        const { key } = evt as KeyboardEvent;
        if (key === "Tab") {
          if (filterClauseModel.column === selectedColumn) {
            // No selection change, allow normal Tab navigation (to Save button)
            return;
          } else {
            // Tab is being used to change selection, keep focus within the clause
            evt.preventDefault();
          }
        }
      }
    }
    filterClauseModel.column = selectedColumn;
    setTimeout(() => {
      console.log(`focus next element`);
      focusNextElement();
    }, 100);
  };

  const onSelectOperator = useCallback(
    (_, selectedOp: FilterClauseOp) => {
      filterClauseModel.setOp(selectedOp);
      focusNextElement();
    },
    [filterClauseModel]
  );

  const handleChangeValue = useCallback<FilterClauseValueChangeHandler>(
    (value, isFinal) => filterClauseModel.setValue(value, isFinal),
    [filterClauseModel]
  );

  const handleDeselectValue = useCallback(
    () => filterClauseModel.setValue(undefined),
    [filterClauseModel]
  );

  const handleKeyDownCaptureNavigation = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (["ArrowLeft", "ArrowRight"].includes(evt.key)) {
        navigateToNextItemIfAtBoundary(evt);
      } else if (evt.key === "Backspace") {
        removeAndNavigateToNextInputIfAtBoundary(evt);
      } else if (evt.key === "Escape") {
        onCancel?.(filterClauseModel, "Escape");
      } else if (evt.key === "Tab" && evt.shiftKey) {
        evt.preventDefault();
        tabToPreviousFilterCombinator(evt.target as HTMLElement);
      }
    },
    [filterClauseModel, onCancel, removeAndNavigateToNextInputIfAtBoundary]
  );

  const handleFocus = useCallback<FocusEventHandler>((evt) => {
    if (elementIsFilterClause(evt.target)) {
      focusField(evt.target);
    }
  }, []);

  const inputProps = useMemo(
    () => ({
      onKeyDownCapture: handleKeyDownCaptureNavigation,
      tabIndex: -1,
    }),
    [handleKeyDownCaptureNavigation]
  );

  // Do we need this or can we leave it to the filterEditor
  useEffect(() => {
    if (filterClauseModel.column === undefined) {
      requestAnimationFrame(() => {
        const columnInput = columnRef?.current?.querySelector("input");
        columnInput?.focus();
      });
    }
  }, [filterClauseModel]);

  return {
    inputProps,
    columnRef,
    filterClause,
    onChangeValue: handleChangeValue,
    onDeselectValue: handleDeselectValue,
    onSelectColumn,
    onFocus: handleFocus,
    onSelectOperator,
    operatorRef,
    selectedColumn: columnsByName[filterClause.column ?? ""],
  };
};
