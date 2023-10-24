import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { FilterClause, FilterClauseOp } from "@finos/vuu-filter-types";
import {
  isMultiValueFilter,
  isSingleValueFilter,
  isValidFilterClauseOp,
} from "@finos/vuu-utils";
import { getColumnByName, TableSchema } from "@finos/vuu-data";

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SingleSelectionHandler } from "@finos/vuu-ui-controls/src";

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

const getFocusedField = () =>
  document.activeElement?.closest(".vuuFilterClauseField") as HTMLElement;

const focusNextFocusableElement = (direction: "fwd" | "bwd" = "fwd") => {
  const activeField = getFocusedField();
  const filterClause = activeField?.closest(".vuuFilterClause");
  if (filterClause?.lastChild === activeField) {
    requestAnimationFrame(() => {
      focusNextFocusableElement();
    });
  } else {
    const nextField =
      direction === "fwd"
        ? (activeField.nextElementSibling as HTMLElement)
        : (activeField.previousElementSibling as HTMLElement);

    nextField?.querySelector("input")?.focus();
  }
};

const focusNextElement = () => {
  const filterClauseField = getFocusedField();
  const filterClause = filterClauseField?.closest(".vuuFilterClause");
  if (filterClause && filterClauseField) {
    if (filterClauseField.classList.contains("vuuFilterClauseValue")) {
      const clearButton = filterClause.querySelector(
        ".vuuFilterClause-closeButton"
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

export interface FilterClauseEditorHookProps {
  filterClause: Partial<FilterClause>;
  onChange: (filterClause: Partial<FilterClause>) => void;
  tableSchema: TableSchema;
}

export const useFilterClauseEditor = ({
  filterClause,
  onChange,
  tableSchema,
}: FilterClauseEditorHookProps) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  const [selectedColumn, setSelectedColumn] = useState<
    ColumnDescriptor | undefined
  >(getColumnByName(tableSchema, filterClause.column));
  const [operator, _setOperator] = useState<FilterClauseOp | undefined>(
    filterClause.op
  );

  const setOperator = useCallback((op) => {
    _setOperator(op);
  }, []);

  const [value, setValue] = useState<FilterClauseValue | undefined>(
    getFilterClauseValue(filterClause)
  );

  const handleSelectionChangeColumn = useCallback<
    SingleSelectionHandler<ColumnDescriptor>
  >(
    (evt, column) => {
      setSelectedColumn(column ?? undefined);
      setOperator(undefined);
      setValue(undefined);
      focusNextElement();
    },
    [setOperator]
  );

  const handleSelectionChangeOperator = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
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
        // This have no effect if we are inside a FilterBar
        requestAnimationFrame(() => {
          focusNextElement();
        });
      }
    },
    [onChange, operator, selectedColumn?.name]
  );

  const handleKeyDownInput = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (["ArrowLeft", "ArrowRight"].includes(evt.key)) {
        navigateToNextInputIfAtBoundary(evt);
      } else if (
        operator &&
        evt.key === "Enter" &&
        ["starts", "ends"].includes(operator)
      ) {
        console.log("enter");
      }
    },
    [operator]
  );

  const InputProps = useMemo(
    () => ({
      inputProps: {
        onKeyDown: handleKeyDownInput,
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
    onSelectionChangeColumn: handleSelectionChangeColumn,
    onSelectionChangeOperator: handleSelectionChangeOperator,
    operator,
    operatorRef,
    selectedColumn,
    value,
    valueRef,
  };
};
