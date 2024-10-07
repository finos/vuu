import { FilterClause, FilterClauseOp } from "@finos/vuu-filter-types";
import { hasOpenOptionList } from "@finos/vuu-utils";
import {
  KeyboardEvent,
  RefCallback,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterClauseProps } from "./FilterClause";
import {
  clauseIsNotFirst,
  focusNextElement,
  focusNextFocusableElement,
  navigateToNextItemIfAtBoundary,
  tabToPreviousFilterCombinator,
} from "./filterClauseFocusManagement";
export type FilterClauseEditorHookProps = Pick<
  FilterClauseProps,
  "columnsByName" | "filterClauseModel" | "onCancel" | "onFocusSave"
>;

export type FilterClauseValueChangeHandler = (
  value: string | string[] | number | number[],
  isFinal?: boolean,
) => void;

export const useFilterClause = ({
  filterClauseModel,
  onCancel,
  columnsByName,
  onFocusSave,
}: FilterClauseEditorHookProps) => {
  const [filterClause, setFilterClause] = useState<Partial<FilterClause>>(
    filterClauseModel.isValid ? filterClauseModel.asFilter() : {},
  );

  useMemo(() => {
    filterClauseModel.on("filterClause", (filterClause) => {
      setFilterClause(filterClause);
    });
  }, [filterClauseModel]);

  const columnRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement | null>(null);

  const setValueRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      valueRef.current = el;
      if (!filterClauseModel.isValid) {
        el?.querySelector("input")?.focus();
      }
    },
    [filterClauseModel.isValid],
  );

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
    [filterClauseModel, onCancel],
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
      focusNextElement();
    }, 100);
  };

  const onSelectOperator = useCallback(
    (_, selectedOp: FilterClauseOp) => {
      filterClauseModel.setOp(selectedOp);
      focusNextElement();
    },
    [filterClauseModel],
  );

  const handleChangeValue = useCallback<FilterClauseValueChangeHandler>(
    (value, isFinal) => filterClauseModel.setValue(value, isFinal),
    [filterClauseModel],
  );

  const handleDeselectValue = useCallback(
    () => filterClauseModel.setValue(undefined),
    [filterClauseModel],
  );

  const handleKeyDownCaptureNavigation = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (["ArrowLeft", "ArrowRight"].includes(evt.key)) {
        navigateToNextItemIfAtBoundary(evt);
      } else if (evt.key === "Backspace") {
        removeAndNavigateToNextInputIfAtBoundary(evt);
      } else if (evt.key === "Escape") {
        // ignore when optionlist is open, the optionList will be collapsed
        if (!hasOpenOptionList(evt.target)) {
          onCancel?.(filterClauseModel, "Escape");
        }
      } else if (evt.key === "Tab" && evt.shiftKey) {
        evt.preventDefault();
        tabToPreviousFilterCombinator(evt.target as HTMLElement);
      } else if (evt.key === "Tab") {
        // if the clause is valid, skip to save
        if (filterClauseModel.isValid) {
          evt.preventDefault();
          evt.stopPropagation();
          // TODO focus cancel if not changed
          onFocusSave?.();
        }
      }
    },
    [
      filterClauseModel,
      onCancel,
      onFocusSave,
      removeAndNavigateToNextInputIfAtBoundary,
    ],
  );

  const inputProps = useMemo(
    () => ({
      onKeyDownCapture: handleKeyDownCaptureNavigation,
      tabIndex: -1,
    }),
    [handleKeyDownCaptureNavigation],
  );

  // Do we need this or can we leave it to the filterEditor
  useEffect(() => {
    // leave the valueInput to callbackRef handler above, may
    // fire after the requestAnimationFrame
    if (!filterClauseModel.isValid) {
      const inputRef =
        filterClauseModel.column === undefined
          ? columnRef
          : filterClauseModel.op === undefined
            ? operatorRef
            : null;

      requestAnimationFrame(() => {
        inputRef?.current?.querySelector("input")?.focus();
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
    onSelectOperator,
    operatorRef,
    selectedColumn: columnsByName[filterClauseModel.column ?? ""],
    valueRef: setValueRef,
  };
};
