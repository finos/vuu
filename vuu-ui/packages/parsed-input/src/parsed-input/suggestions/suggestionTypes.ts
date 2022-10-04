import { SelectionStrategy } from "@heswell/uitk-lab";
import { SuggestionItem } from "@vuu-ui/datagrid-parsers";
import { RefObject } from "react";

export type AcceptSuggestion<Selection extends SelectionStrategy> = (
  evt: any,
  selected: Selection extends "default"
    ? SuggestionItem | null
    : SuggestionItem[],
  insertSymbol?: string
) => void;

export interface SuggestionHookProps<Selection extends SelectionStrategy> {
  selectionStrategy: Selection;
  onCommit?: () => void;
  setCurrentText: (text: string) => void;
  setText: (text: string) => void;
  textRef: RefObject<string>;
}

export interface SuggestionHookResult<Selection extends SelectionStrategy> {
  acceptSuggestion: AcceptSuggestion<Selection>;
  suggestionProposed: RefObject<string>;
}
