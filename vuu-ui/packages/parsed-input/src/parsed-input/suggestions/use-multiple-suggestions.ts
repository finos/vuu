import { SuggestionItem } from "@vuu-ui/datagrid-parsers";
import { useCallback, useRef } from "react";
import { getCompletion } from "../input-utils";
import {
  AcceptSuggestion,
  SuggestionHookProps,
  SuggestionHookResult,
} from "./suggestionTypes";

const isCompleteSelected = ({ value }: SuggestionItem) =>
  value === "]" || value === "EOF";

const getDeselectedValues = (oldValues, newValues) => {
  const deselectedValues = [];
  for (let value of oldValues) {
    if (!newValues.includes(value)) {
      deselectedValues.push(value);
    }
  }
  return deselectedValues;
};

const removeValueFromText = (text: string, value: string) => {
  const pos = text.lastIndexOf(value);
  const preOffset = text[pos - 1] === " " && text[pos - 2] === "," ? 2 : 0;
  const postOffset =
    preOffset === 0 && text[pos + value.length] === "," ? 2 : 0;
  const result =
    text.slice(0, pos - preOffset) +
    text.slice(pos + postOffset + value.length);
  return result;
};

// TODO when we backspace into a set of selections, how do we build the selected state from the existing entries ?
export const useMultipleSuggestions = <Selection extends "multiple">({
  selectionStrategy,
  setCurrentText,
  setText,
  textRef,
}: SuggestionHookProps<Selection>):
  | SuggestionHookResult<Selection>
  | undefined => {
  const suggestionProposed = useRef("");
  const selectedValues = useRef<SuggestionItem[]>([]);

  const handleSuggestionSelection: AcceptSuggestion<"multiple"> = useCallback(
    (evt: any, selectedSuggestions: SuggestionItem[], insertedSymbol = "") => {
      const { current: values } = selectedValues;
      const textRoot = textRef.current;
      const [lastSelected] = selectedSuggestions.slice(-1);
      if (isCompleteSelected(lastSelected)) {
        // we've completed our selection from this list
        setCurrentText(textRoot + "] ");
        setText(textRoot + "] ");
        selectedValues.current = [];
        // setSelected([]);
        // same hack as below
        return [];
      } else if (selectedSuggestions.length < values.length) {
        const [deselectedValue] = getDeselectedValues(
          values,
          selectedSuggestions
        );
        if (deselectedValue) {
          const textWithValueRemoved = removeValueFromText(
            textRoot,
            deselectedValue
          );
          setCurrentText(textWithValueRemoved);
          setText(textWithValueRemoved);
        }
        return selectedSuggestions;
      } else {
        const cursorAtEndOfText = false;
        const [suggestedText] = getCompletion(
          lastSelected,
          cursorAtEndOfText,
          selectedSuggestions.length
        );

        selectedValues.current = selectedSuggestions;
        const listOpen =
          insertedSymbol && textRoot.slice(-1) !== insertedSymbol
            ? insertedSymbol
            : "";
        setCurrentText(textRoot + listOpen + suggestedText);
        setText(textRoot + listOpen + suggestedText);
        return selectedSuggestions;
      }
    },
    [textRef, isCompleteSelected, setCurrentText, setText]
  );

  return selectionStrategy === "multiple"
    ? {
        acceptSuggestion: handleSuggestionSelection,
        suggestionProposed,
      }
    : undefined;
};
