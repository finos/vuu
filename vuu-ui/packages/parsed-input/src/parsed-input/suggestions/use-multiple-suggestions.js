import { useCallback, useRef } from 'react';
import { getCompletion } from '../input-utils';

// search predicate
const findComplete = (s) => s.value === 'EOF' || s.value === ']';

const mapidsToValues = (items, ids) => ids.map((id) => items.find((s) => s.id === id)?.value);

const getDeselectedValues = (oldValues, newValues) => {
  const deselectedValues = [];
  for (let value of oldValues) {
    if (!newValues.includes(value)) {
      deselectedValues.push(value);
    }
  }
  return deselectedValues;
};

const removeValueFromText = (text, value) => {
  const pos = text.lastIndexOf(value);
  const preOffset = text[pos - 1] === ' ' && text[pos - 2] === ',' ? 2 : 0;
  const postOffset = preOffset === 0 && text[pos + value.length] === ',' ? 2 : 0;
  const result = text.slice(0, pos - preOffset) + text.slice(pos + postOffset + value.length);
  return result;
};

// TODO when we backspace into a set of selections, how do we build the selected state from the existing entries ?
export const useMultipleSuggestions = ({
  isMultiSelect,
  setCurrentText,
  setText,
  textRef,
  indexPositions
}) => {
  const suggestionProposed = useRef('');
  const selectedValues = useRef([]);

  const isCompleteSelected = useCallback(
    (selectedId) => selectedId === indexPositions.find(findComplete)?.id,
    [indexPositions]
  );

  const handleSuggestionSelection = useCallback(
    (evt, selectedIds, insertedSymbol = '') => {
      const newValues = mapidsToValues(indexPositions, selectedIds);
      const { current: values } = selectedValues;
      const textRoot = textRef.current;
      const [lastSelectedId] = selectedIds.slice(-1);
      if (isCompleteSelected(lastSelectedId)) {
        // we've completed our selection from this list
        setCurrentText(textRoot + '] ');
        setText(textRoot + '] ');
        selectedValues.current = [];
        // setSelected([]);
        // same hack as below
        return [];
      } else if (newValues.length < values.length) {
        const [deselectedValue] = getDeselectedValues(values, newValues);
        if (deselectedValue) {
          const textWithValueRemoved = removeValueFromText(textRoot, deselectedValue);
          setCurrentText(textWithValueRemoved);
          setText(textWithValueRemoved);
        }
        return selectedIds;
      } else {
        const cursorAtEndOfText = false;
        const [suggestedText] = getCompletion(
          indexPositions,
          lastSelectedId,
          cursorAtEndOfText,
          selectedIds.length
        );

        selectedValues.current = newValues;
        const listOpen =
          insertedSymbol && textRoot.slice(-1) !== insertedSymbol ? insertedSymbol : '';
        setCurrentText(textRoot + listOpen + suggestedText);
        setText(textRoot + listOpen + suggestedText);
        return selectedIds;
      }
    },
    [indexPositions, textRef, isCompleteSelected, setCurrentText, setText]
  );

  return isMultiSelect
    ? {
        acceptSuggestion: handleSuggestionSelection,
        suggestionProposed
      }
    : undefined;
};
