import { getElementDataIndex, queryClosest } from "@vuu-ui/vuu-utils";
import { KeyboardEvent } from "react";

const getFilterClauseElement = (possiblyDescendant?: HTMLElement) =>
  possiblyDescendant?.closest(".vuuFilterClause") as HTMLElement;

const getFilterClauseFieldElement = (possiblyDescendant?: HTMLElement) =>
  possiblyDescendant?.closest(".vuuFilterClauseField") as HTMLElement;

type FilterClauseFieldName = "column" | "operator" | "value";
const mapFilterFieldToClassName: Record<FilterClauseFieldName, string> = {
  column: "vuuFilterClauseColumn",
  operator: "vuuFilterClauseOperator",
  value: "vuuFilterClauseValue",
};

const getFilterClauseDetails = ({ classList }: HTMLElement) => {
  if (classList.contains("vuuFilterClauseColumn")) {
    return "column";
  } else if (classList.contains("vuuFilterClauseOperator")) {
    return "operator";
  } else if (classList.contains("vuuFilterClauseValue")) {
    return "value";
  } else {
    throw Error(
      "getFilterClauseField, filterClauseElemnent is missing required class name",
    );
  }
};

export const getFocusedFieldDetails = (): [number, string] | [] => {
  const el = document.activeElement as HTMLElement;
  const field = queryClosest(el, ".vuuFilterClauseField");
  const filterClause = queryClosest(field, ".vuuFilterClause");
  if (field && filterClause) {
    return [getElementDataIndex(filterClause), getFilterClauseDetails(field)];
  }
  return [];
};

// Focus the input control within field. If clause passed, will
// focus first field within clause
const focusField = (fieldOrClause: HTMLElement | null) => {
  const input = fieldOrClause?.querySelector("input");
  if (input) {
    input.focus();
    requestAnimationFrame(() => {
      input?.select();
    });
  }
};

export const elementIsFilterClause = (
  element: Element | null,
): element is HTMLElement =>
  element !== null && element.classList.contains("vuuFilterClause");

export const focusFilterClauseField = (
  filterEditor: HTMLElement,
  filterClauseIndex: number,
  fieldName: FilterClauseFieldName = "value",
) => {
  if (filterEditor) {
    const fieldClassName = mapFilterFieldToClassName[fieldName];
    const field = filterEditor.querySelector(
      `.vuuFilterClause[data-index="${filterClauseIndex}"] .${fieldClassName}`,
    ) as HTMLElement;
    focusField(field);
  }
};

export const focusLastClauseValue = (filterEditor: HTMLElement) => {
  const field = Array.from(
    filterEditor?.querySelectorAll(".vuuFilterClauseField"),
  ).at(-1) as HTMLElement;
  focusField(field);
};

// How many frames to wait for the next field to be rendered
const MAX_FOCUS_RETRIES = 5;

export const focusNextFocusableElement = (
  direction: "fwd" | "bwd" = "fwd",
  retries = MAX_FOCUS_RETRIES,
) => {
  const activeField = getFilterClauseFieldElement(
    document.activeElement as HTMLElement,
  );
  const filterClause = getFilterClauseElement(activeField);
  if (direction === "fwd" && filterClause?.lastChild === activeField) {
    // The next field is rendered once the selection in this one has been
    // applied to the model.
    if (retries > 0) {
      requestAnimationFrame(() => {
        focusNextFocusableElement(direction, retries - 1);
      });
    }
  } else {
    const nextField =
      direction === "fwd"
        ? (activeField?.nextElementSibling as HTMLElement)
        : (activeField?.previousElementSibling as HTMLElement);

    nextField?.querySelector("input")?.focus();
  }
};

/**
 * Move focus from column to operator or from operator to value. Focus moves
 * from value to the Save button when the value is committed (see FilterEditor).
 */
export const focusNextElement = () => {
  const filterClauseField = getFilterClauseFieldElement(
    document.activeElement as HTMLElement,
  );
  if (
    filterClauseField &&
    !filterClauseField.classList.contains("vuuFilterClauseValue")
  ) {
    focusNextFocusableElement();
  }
};

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

export const clauseIsNotFirst = (el: HTMLElement) => {
  const clause = getFilterClauseElement(el);
  if (clause) {
    const index = getElementDataIndex(clause);
    return index > 0;
  }
};

const clauseIsNotLast = (el: HTMLElement) => {
  const clause = getFilterClauseElement(el);
  const nextClause = clause?.nextElementSibling as HTMLElement;
  return nextClause?.classList.contains("vuuFilterClauseCombinator");
};

/**
 * Shift+Tab moves focus to the previous field in the clause, from the column
 * field to the preceding combinator. Returns false when the column field of
 * the first clause has focus, Shift+Tab then moves focus out of the editor.
 */
export const tabToPreviousField = (currentElement: HTMLElement) => {
  const field = getFilterClauseFieldElement(currentElement);
  if (getFieldName(field) !== "column") {
    focusField(field.previousElementSibling as HTMLElement);
    return true;
  } else if (clauseIsNotFirst(currentElement)) {
    const filterClause = getFilterClauseElement(currentElement);
    (filterClause.previousElementSibling as HTMLElement | null)?.focus();
    return true;
  }
  return false;
};

/**
 * Navigate from a filter combinator to the value field of the preceding
 * clause (bwd) or the column field of the following clause (fwd).
 */
export const navigateToNextFilterClause = (
  combinator: HTMLElement,
  direction: "bwd" | "fwd" = "fwd",
) => {
  if (direction === "bwd") {
    const previousClause = combinator.previousElementSibling;
    if (elementIsFilterClause(previousClause)) {
      focusField(
        previousClause.querySelector(".vuuFilterClauseValue") as HTMLElement,
      );
    }
  } else {
    focusField(combinator.nextElementSibling as HTMLElement);
  }
};

// The logic around preventDefault/stopPropagation is important
// in this function
export const navigateToNextItemIfAtBoundary = (
  evt: KeyboardEvent<HTMLInputElement>,
) => {
  const input = evt.target as HTMLInputElement;
  const field = getFilterClauseFieldElement(input);
  if (evt.key === "ArrowLeft") {
    if (cursorAtTextStart(input)) {
      const fieldName = getFieldName(field);
      if (fieldName === "column") {
        if (clauseIsNotFirst(input)) {
          const filterClause = getFilterClauseElement(field);
          const combinator = filterClause.previousElementSibling as HTMLElement;
          combinator?.focus();
        }
      } else {
        evt.preventDefault();
        focusField(field.previousSibling as HTMLElement);
      }
    }
    // stopPropagation, even if cursor is not at start. We want the arrowLeft to move the cursor
    evt.stopPropagation();
  } else if (evt.key === "ArrowRight") {
    if (cursorAtTextEnd(input as HTMLInputElement)) {
      const fieldName = getFieldName(field);
      if (fieldName === "value") {
        if (clauseIsNotLast(input)) {
          const filterClause = getFilterClauseElement(field);
          const combinator = filterClause.nextElementSibling as HTMLElement;
          combinator?.focus();
        }
        // Do not preventDefault, stopPropagation
        return;
      } else {
        evt.preventDefault();
        focusField(field.nextSibling as HTMLElement);
      }
    }
    // stopPropagation, even if cursor is not at end. We want the arrowRight to move the cursor
    evt.stopPropagation();
  }
};

export const focusFirstClauseIfAllClausesValid = (
  filterEditor: HTMLElement,
) => {
  const columInput = Array.from(
    filterEditor.querySelectorAll(".vuuFilterClauseColumn input"),
  ) as HTMLInputElement[];
  if (columInput.every((input) => input.value.length > 0)) {
    setTimeout(() => {
      const input = columInput.at(0);
      input?.select();
      input?.focus();
    }, 100);
  }
};
