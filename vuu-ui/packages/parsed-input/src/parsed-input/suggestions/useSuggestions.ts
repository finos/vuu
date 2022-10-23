import { useSingleSuggestion } from "./use-single-suggestion";
import { useMultipleSuggestions } from "./use-multiple-suggestions";
import { SuggestionHookProps, SuggestionHookResult } from "./suggestionTypes";
import { SelectionStrategy } from "@heswell/uitk-lab";

export const useSuggestions = <Selection extends SelectionStrategy>({
  selectionStrategy,
  onCommit,
  setCurrentText,
  setText,
  textRef,
}: SuggestionHookProps<Selection>): SuggestionHookResult<Selection> => {
  const options = {
    selectionStrategy,
    onCommit,
    setCurrentText,
    setText,
    textRef,
  };
  // because hooks are different internally and because of 'rule of hooks' we must always call both
  // one will always return undefined
  const singleSelectResult = useSingleSuggestion(options);
  const multiSelectResult = useMultipleSuggestions(options);

  if (singleSelectResult) {
    return singleSelectResult;
  } else if (multiSelectResult) {
    return multiSelectResult;
  } else {
    throw Error("This will never happen");
  }
};
