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
  const field = queryClosest(el, ".vuuFilterClauseField,.saltCalendar");
  if (field?.matches(".vuuFilterClauseField")) {
    const filterClause = queryClosest(field, ".vuuFilterClause");
    if (filterClause && field) {
      return [getElementDataIndex(filterClause), getFilterClauseDetails(field)];
    }
  } else if (field?.matches(".saltCalendar")) {
    console.log("its in a calendar");
  }
  // const filterClause = queryClosest(field, ".vuuFilterClause");
  // if (filterClause && field) {
  //   return [getElementDataIndex(filterClause), getFilterClauseDetails(field)];
  // } else {
  return [];
  // }
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

export const elementIsFilterCombinator = (
  element: Element | null,
): element is HTMLElement =>
  element !== null && element.classList.contains("vuuFilterClauseCombinator");

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
  console.log("focusLastClauseValue");
  const field = Array.from(
    filterEditor?.querySelectorAll(".vuuFilterClauseField"),
  ).at(-1) as HTMLElement;
  focusField(field);
};

export const focusNextFocusableElement = (direction: "fwd" | "bwd" = "fwd") => {
  const activeField = getFocusedField() as HTMLElement;
  const filterClause = getFilterClauseElement(activeField);
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

const getFocusedField = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement?.classList.contains("vuuFilterClause-clearButton")) {
    return activeElement as HTMLElement;
  } else {
    return getFilterClauseFieldElement(activeElement);
  }
};

export const focusNextElement = () => {
  const filterClauseField = getFocusedField();
  const filterClause = getFilterClauseElement(filterClauseField);
  if (filterClause && filterClauseField) {
    if (filterClauseField.classList.contains("vuuFilterClauseValue")) {
      const clearButton = filterClause.querySelector(
        ".vuuFilterClause-clearButton",
      ) as HTMLButtonElement;
      clearButton?.focus();
    } else {
      focusNextFocusableElement();
    }
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

export const tabToPreviousFilterCombinator = (currentElement: HTMLElement) => {
  const filterClause = getFilterClauseElement(currentElement);
  const nextItem = filterClause.previousSibling as HTMLElement;
  console.log(`tab to previous combinator`);
  nextItem?.focus();
};

export const navigateToNextFilterClause = (
  currentElement: HTMLElement,
  direction: "bwd" | "fwd" = "fwd",
) => {
  if (direction === "bwd") {
    if (elementIsFilterCombinator(currentElement)) {
      const nextClause = currentElement.previousElementSibling;
      if (elementIsFilterClause(nextClause)) {
        const nextField = nextClause.querySelector(
          ".vuuFilterClauseValue",
        ) as HTMLElement;
        console.log(`focus field Value ${nextField?.classList}`);
        focusField(nextField);
      }
    } else {
      const filterClause = getFilterClauseElement(currentElement);
      const nextClause = filterClause.previousSibling as HTMLElement;
      const nextField = nextClause.querySelector(
        ".vuuFilterClauseValue",
      ) as HTMLElement;
      focusField(nextField);
    }
  } else {
    const nextClause = currentElement.nextSibling as HTMLElement;
    focusField(nextClause);
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
