import { SuggestionItem } from "@vuu-ui/datagrid-parsers";
import { useCallback, useRef } from "react";
import { getCompletion } from "../input-utils";
import {
  AcceptSuggestion,
  SuggestionHookProps,
  SuggestionHookResult,
} from "./suggestionTypes";

// search predicate
const findComplete = (s: SuggestionItem) =>
  s.value === "EOF" || s.value === "]";

// TODO when we backspace into a set of selections, how do we build the selected state from the existing entries ?
export const useSingleSuggestion = <Selection extends "default">({
  selectionStrategy,
  onCommit,
  setCurrentText,
  setText,
  textRef,
}: SuggestionHookProps<Selection>):
  | SuggestionHookResult<Selection>
  | undefined => {
  const suggestionProposed = useRef("");

  const handleSuggestionSelection: AcceptSuggestion<"default"> = useCallback(
    (evt, suggestion: SuggestionItem | null) => {
      if (suggestion !== null) {
        const textRoot = textRef.current;
        if (suggestion.value === "EOD" || suggestion.value === "]") {
          // we've completed our whole input
          onCommit?.();
        } else {
          const cursorAtEndOfText = false;
          const [suggestedText, parserText = suggestedText] = getCompletion(
            suggestion,
            cursorAtEndOfText,
            1
          );

          setCurrentText(textRoot + suggestedText);
          setText(textRoot + suggestedText + " ", textRoot + parserText + " ");
          suggestionProposed.current = "";
        }
      }
    },
    [onCommit, setCurrentText, setText, textRef]
  );

  return selectionStrategy === "default"
    ? {
        acceptSuggestion: handleSuggestionSelection,
        suggestionProposed,
      }
    : undefined;
};
