import { FilterClause, FilterClauseOp } from "@vuu-ui/vuu-filter-types";
import { hasOpenOptionList } from "@vuu-ui/vuu-utils";
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
import { ComboBoxOpenChangeHandler } from "./ExpandoCombobox";

export type FilterClauseEditorHookProps = Pick<
  FilterClauseProps,
  "columnsByName" | "filterClauseModel" | "onCancel" | "onFocusSave"
> & { onOpenChange?: ComboBoxOpenChangeHandler; dropdownOnAutofocus?: boolean };

export type FilterClauseValueChangeHandler = (
  value: string | string[] | number | number[],
  isFinal?: boolean,
) => void;

export const useFilterClause = ({
  filterClauseModel,
  onCancel,
  columnsByName,
  onFocusSave,
  onOpenChange,
  dropdownOnAutofocus = true,
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
  const filterTouched = useRef(false);

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
    (_: SyntheticEvent, selectedOp: FilterClauseOp) => {
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

  const handleOpenChange = useCallback<ComboBoxOpenChangeHandler>(
    (open, closeReason) => {
      const isMultiSelect = filterClauseModel.op === "in";
      const filterHasNoValue =
        !filterClauseModel.isValid &&
        filterClauseModel.op !== undefined &&
        filterClauseModel.column !== undefined;

      if (
        !open &&
        isMultiSelect &&
        (filterClauseModel.isValid || filterHasNoValue)
      ) {
        filterClauseModel.commit();
      }
      onOpenChange?.(open, closeReason);
    },
    [filterClauseModel, onOpenChange],
  );

  const inputProps = useMemo(
    () => ({
      onKeyDownCapture: handleKeyDownCaptureNavigation,
      tabIndex: -1,
      onFocus: () => filterTouched.current = true,
    }),
    [handleKeyDownCaptureNavigation],
  );

  // Do we need this or can we leave it to the filterEditor
  useEffect(() => {
    // leave the valueInput to callbackRef handler above, may
    // fire after the requestAnimationFrame
    const inputRef =
      filterClauseModel.column === undefined
        ? columnRef
        : filterClauseModel.op === undefined
          ? operatorRef
          : null;

    if (!filterClauseModel.isValid && inputRef) {
      requestAnimationFrame(() => {
        inputRef.current?.querySelector("input")?.focus();
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
    onOpenChange: handleOpenChange,
    operatorRef,
    selectedColumn: columnsByName[filterClauseModel.column ?? ""],
    valueRef: setValueRef,
    showDropdownOnAutoFocus: dropdownOnAutofocus || filterTouched.current,
  };
};
