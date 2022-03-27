import { useCallback, useRef } from 'react';
import { getCompletion } from '../input-utils';

// search predicate
const findComplete = (s) => s.value === 'EOF' || s.value === ']';

// TODO when we backspace into a set of selections, how do we build the selected state from the existing entries ?
export const useSingleSuggestion = ({
  isMultiSelect,
  onCommit,
  setCurrentText,
  setText,
  textRef,
  indexPositions
}) => {
  const suggestionProposed = useRef('');

  const isCompleteSelected = useCallback(
    (selectedId) => selectedId === indexPositions.find(findComplete)?.id,
    [indexPositions]
  );

  const handleSuggestionSelection = useCallback(
    (evt, selectedIds) => {
      const textRoot = textRef.current;
      const [lastSelectedId] = selectedIds.slice(-1);
      if (isCompleteSelected(lastSelectedId)) {
        // we've completed our whole input
        onCommit && onCommit();
      } else {
        const cursorAtEndOfText = false;
        const [suggestedText, parserText = suggestedText] = getCompletion(
          indexPositions,
          lastSelectedId,
          cursorAtEndOfText,
          selectedIds.length
        );

        setCurrentText(textRoot + suggestedText);
        setText(textRoot + suggestedText + ' ', textRoot + parserText + ' ');
        suggestionProposed.current = '';
      }
    },
    [indexPositions, isCompleteSelected, onCommit, setCurrentText, setText, textRef]
  );

  return isMultiSelect
    ? undefined
    : {
        acceptSuggestion: handleSuggestionSelection,
        suggestionProposed
      };
};
