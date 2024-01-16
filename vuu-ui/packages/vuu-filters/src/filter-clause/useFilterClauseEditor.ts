import { FilterClause, FilterClauseOp } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  isMultiValueFilter,
  isSingleValueFilter,
  isValidFilterClauseOp,
} from "@finos/vuu-utils";

import { SingleSelectionHandler } from "@finos/vuu-ui-controls";
import {
  KeyboardEvent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const cursorAtTextStart = (input: HTMLInputElement) =>
  input.selectionStart === 0;

const cursorAtTextEnd = (input: HTMLInputElement) =>
  input.selectionStart === input.value.length;

const getFieldName = (field: HTMLElement) =>
  field?.classList.contains("vuuFilterClauseColumn")
    ? "column"
    : field?.classList.contains("vuuFilterClauseOperator")
    ? "operator"
    : "value";

const getFocusedField = () => {
  const activeElement = document.activeElement;
  if (activeElement?.classList.contains("vuuFilterClause-clearButton")) {
    return activeElement;
  } else {
    return activeElement?.closest(".vuuFilterClauseField") as HTMLElement;
  }
};

const focusNextFocusableElement = (direction: "fwd" | "bwd" = "fwd") => {
  const activeField = getFocusedField();
  const filterClause = activeField?.closest(".vuuFilterClause");
  if (direction === "fwd" && filterClause?.lastChild === activeField) {
    requestAnimationFrame(() => {
      focusNextFocusableElement();
    });
  } else {
    const nextField =
      direction === "fwd"
        ? (activeField?.nextElementSibling as HTMLElement)
        : (activeField?.previousElementSibling as HTMLElement);

    nextField?.querySelector("input")?.focus();
  }
};

const clauseIsNotFirst = (el: HTMLElement) => {
  const clause = el.closest("[data-index]") as HTMLElement;
  if (clause) {
    const index = clause.dataset.index;
    const previousClause = clause?.parentElement?.querySelector(
      `[data-index]:has(.vuuFilterClause):has(+[data-index="${index}"])`
    );
    return previousClause !== null;
  }
};

const focusNextElement = () => {
  const filterClauseField = getFocusedField();
  const filterClause = filterClauseField?.closest(".vuuFilterClause");
  if (filterClause && filterClauseField) {
    if (filterClauseField.classList.contains("vuuFilterClauseValue")) {
      const clearButton = filterClause.querySelector(
        ".vuuFilterClause-clearButton"
      ) as HTMLButtonElement;
      clearButton?.focus();
    } else {
      focusNextFocusableElement();
    }
  }
};

// The logic around preventDefault/stopPragagation is important
// in this function
const navigateToNextInputIfAtBoundary = (
  evt: KeyboardEvent<HTMLInputElement>
) => {
  const input = evt.target as HTMLInputElement;
  const cursorAtStart = cursorAtTextStart(input);
  const cursorAtEnd = cursorAtTextEnd(input);
  const field = input.closest(".vuuFilterClauseField") as HTMLElement;
  if (evt.key === "ArrowLeft") {
    if (cursorAtStart) {
      const fieldName = getFieldName(field);
      if (fieldName === "column") {
        // Do not preventDefault, stopPropagation
        return;
      } else {
        const nextField = field.previousSibling as HTMLElement;
        const nextInput = nextField?.querySelector("input");
        evt.preventDefault();
        console.log("%cfocus nextInput", "color:green;font-weight:bold");

        nextInput?.focus();
        requestAnimationFrame(() => {
          nextInput?.select();
        });
      }
    }
    // stopPropagation, even if cursor is not at start. We want the arrowLeft to move the cursor
    evt.stopPropagation();
  } else if (evt.key === "ArrowRight") {
    if (cursorAtEnd) {
      const fieldName = getFieldName(field);
      if (fieldName === "value") {
        // Do not preventDefault, stopPropagation
        return;
      } else {
        const nextField = field.nextSibling as HTMLElement;
        const nextInput = nextField?.querySelector("input");
        evt.preventDefault();
        nextInput?.focus();
        requestAnimationFrame(() => {
          nextInput?.select();
        });
      }
    }
    // stopPropagation, even if cursor is not at end. We want the arrowRight to move the cursor
    evt.stopPropagation();
  }
};

// TODO boolean[] makes no sense
type FilterClauseValue =
  | boolean
  | boolean[]
  | string
  | string[]
  | number
  | number[];

const getFilterClauseValue = (
  filterClause: Partial<FilterClause>
): FilterClauseValue | undefined => {
  if (isMultiValueFilter(filterClause)) {
    return filterClause.values;
  } else if (isSingleValueFilter(filterClause)) {
    return filterClause.value;
  } else {
    return undefined;
  }
};

export type FilterClauseCancelType = "Backspace";
export type FilterClauseCancelHandler = (
  reason: FilterClauseCancelType
) => void;
export interface FilterClauseEditorHookProps {
  columnDescriptors: Record<string, ColumnDescriptor>;
  filterClause: Partial<FilterClause>;
  onCancel?: FilterClauseCancelHandler;
  onChange: (filterClause: Partial<FilterClause>) => void;
}

export const useFilterClauseEditor = ({
  filterClause,
  onCancel,
  onChange,
  columnDescriptors,
}: FilterClauseEditorHookProps) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);

  const [selectedColumn, setSelectedColumn] = useState<
    ColumnDescriptor | undefined
  >(filterClause.column ? columnDescriptors[filterClause.column] : undefined);
  const [operator, _setOperator] = useState<FilterClauseOp | undefined>(
    filterClause.op
  );

  const setOperator = useCallback((op) => {
    _setOperator(op);
  }, []);

  const [value, setValue] = useState<FilterClauseValue | undefined>(
    getFilterClauseValue(filterClause)
  );

  const handleColumnSelect = useCallback<
    SingleSelectionHandler<ColumnDescriptor>
  >(
    (_, column) => {
      setSelectedColumn(column ?? undefined);
      setOperator(undefined);
      setValue(undefined);
      setTimeout(() => {
        focusNextElement();
      }, 100);
    },
    [setOperator]
  );

  const removeAndNavigateToNextInputIfAtBoundary = useCallback(
    (evt) => {
      const input = evt.target as HTMLInputElement;
      if (input.value === "") {
        const field = input.closest(
          ".vuuFilterClauseField,[data-field]"
        ) as HTMLElement;
        switch (field?.dataset?.field) {
          case "operator": {
            setOperator(undefined);
            setSelectedColumn(undefined);
            focusNextFocusableElement("bwd");
            break;
          }
          case "value": {
            setOperator(undefined);
            focusNextFocusableElement("bwd");
            break;
          }
          case "column": {
            if (clauseIsNotFirst(input)) {
              console.log("This is NOT the first clause");
              onCancel?.("Backspace");
            }
          }
        }
      }
    },
    [onCancel, setOperator]
  );

  const handleOperatorSelect = useCallback<SingleSelectionHandler>(
    (_, selected) => {
      const op = selected;
      if (op === undefined || isValidFilterClauseOp(op)) {
        setOperator(op);
        focusNextElement();
      } else {
        throw Error(
          `FilterClauseEditor, invalid value ${op} for filter clause`
        );
      }
    },
    [setOperator]
  );

  const handleChangeValue = useCallback(
    (value: string | string[] | number | number[]) => {
      setValue(value);
      if (value !== null && value !== "") {
        if (Array.isArray(value)) {
          onChange({
            column: selectedColumn?.name,
            op: operator,
            values: value,
          });
        } else {
          onChange({
            column: selectedColumn?.name,
            op: operator,
            value,
          });
        }
      }
    },
    [onChange, operator, selectedColumn?.name]
  );

  const handleDeselectValue = useCallback(() => {
    setValue(undefined);
  }, []);

  const handleKeyDownInput = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (["ArrowLeft", "ArrowRight"].includes(evt.key)) {
        navigateToNextInputIfAtBoundary(evt);
      } else if (evt.key === "Backspace") {
        removeAndNavigateToNextInputIfAtBoundary(evt);
      } else if (evt.key === "Enter") {
        // If value is valid, move on to next field
        const input = evt.target as HTMLInputElement;
        const field = input.closest("[data-field]") as HTMLElement;
        if (field.dataset.field === "value" && operator === "starts") {
          // // don't let this bubble to the Toolbar, it would be
          // // interpreted as selection
          evt.stopPropagation();
          const newValue = input.value;
          setValue(newValue);
          handleChangeValue(newValue);
        }
      }
    },
    [handleChangeValue, operator, removeAndNavigateToNextInputIfAtBoundary]
  );

  const handleClear = useCallback(
    (e) => {
      const button = e.target as HTMLButtonElement;
      const firstInput = button
        .closest(".vuuFilterClause")
        ?.querySelector("input") as HTMLInputElement;

      setSelectedColumn(undefined);
      setOperator(undefined);
      setValue(undefined);

      setTimeout(() => {
        firstInput.select();
        firstInput?.focus();
      }, 100);
    },
    [setOperator]
  );

  const handleClearKeyDown = useCallback<KeyboardEventHandler>((e) => {
    e.stopPropagation();
    if (e.key === "Backspace") {
      focusNextFocusableElement("bwd");
    }
  }, []);

  const InputProps = useMemo(
    () => ({
      inputProps: {
        onKeyDownCapture: handleKeyDownInput,
      },
    }),
    [handleKeyDownInput]
  );

  useEffect(() => {
    const columnInput = columnRef.current?.querySelector("input");
    columnInput?.focus();
  }, []);

  return {
    InputProps,
    columnRef,
    onChangeValue: handleChangeValue,
    onClear: handleClear,
    onClearKeyDown: handleClearKeyDown,
    onDeselectValue: handleDeselectValue,
    onColumnSelect: handleColumnSelect,
    onOperatorSelect: handleOperatorSelect,
    operator,
    operatorRef,
    selectedColumn,
    value,
  };
};
