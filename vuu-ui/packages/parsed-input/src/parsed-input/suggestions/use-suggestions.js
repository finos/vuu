import { useSingleSuggestion } from './use-single-suggestion';
import { useMultipleSuggestions } from './use-multiple-suggestions';

export const useSuggestions = ({
  isMultiSelect,
  onCommit,
  setCurrentText,
  setHighlighted,
  setText,
  setVisibleData,
  textRef,
  indexPositions
}) => {
  const options = {
    isMultiSelect,
    onCommit,
    setCurrentText,
    setHighlighted,
    setText,
    setVisibleData,
    textRef,
    indexPositions
  };
  // because hooks are different internally and because of 'rule of hooks' we must always call both
  // one will always return undefined
  const singleSelectResult = useSingleSuggestion(options);
  const multiSelectResult = useMultipleSuggestions(options);
  return singleSelectResult || multiSelectResult;
};
