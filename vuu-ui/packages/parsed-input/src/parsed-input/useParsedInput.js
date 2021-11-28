import { useCallback } from 'react';
import {
  useDropdownBehaviour,
  useHierarchicalData,
  useKeyboardNavigation,
  useSelection
} from '@vuu-ui/ui-controls';
import { useInputEditing } from './use-input-editing';
import { useSuggestions } from './use-suggestions';

export const useParsedInput = ({
  // defaultHighlightedIdx,
  highlightedIdx,
  id,
  onCommit,
  onDropdownClose,
  onDropdownOpen,
  onSelectionChange,
  onTextInputChange,
  onHighlight,
  open,
  selected,
  setCurrentText,
  setHighlightedIdx,
  setText,
  textRef,
  sourceWithIds
}) => {
  const dataHook = useHierarchicalData(sourceWithIds);

  const dropdownHook = useDropdownBehaviour({
    open,
    onClose: onDropdownClose,
    onOpen: onDropdownOpen,
    openOnFocus: true
  });

  const {
    acceptSuggestion,
    isMultiSelect,
    // navigationHandlers,
    suggestionProposed,
    suggestions
  } = useSuggestions({
    onCommit,
    selected,
    setCurrentText,
    setHighlighted: setHighlightedIdx,
    setText,
    setVisibleData: dataHook.setData,
    textRef,
    indexPositions: dataHook.indexPositions
  });

  // // IS this needed, it seems to work without it
  // const handleKeyboardNavigation = (evt, nextIdx) => {
  //   navigationHandlers.onKeyboardNavigation?.(evt, nextIdx);
  // };

  const keyboardHook = useKeyboardNavigation({
    // defaultHighlightedIdx,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    id,
    label: 'ParsedInput',
    onHighlight
    // onKeyboardNavigation: handleKeyboardNavigation
  });

  const selectionHook = useSelection({
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    label: 'useParsedInput',
    onChange: onSelectionChange,
    selected,
    selection: isMultiSelect ? 'checkbox' : 'single'
  });

  const editHook = useInputEditing({
    onChange: onTextInputChange,
    onCommit
  });

  const handleKeyDown = useCallback(
    (evt) => {
      dropdownHook.onKeyDown(evt);
      if (!evt.defaultPrevented) {
        keyboardHook.listProps.onKeyDown(evt);
      }
      if (!evt.defaultPrevented) {
        selectionHook.listHandlers.onKeyDown?.(evt);
      }
      if (!evt.defaultPrevented) {
        editHook.handleKeyDown?.(evt);
      }
    },
    [dropdownHook, editHook, keyboardHook.listProps, selectionHook.listHandlers]
  );

  //TODO move to keyboard hook
  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : dataHook.indexPositions[highlightedIdx]?.id;

  const listProps = {
    'aria-activedescendant': getActiveDescendant(),
    onBlur: dropdownHook.onBlur,
    onFocus: dropdownHook.onFocus,
    onKeyDown: handleKeyDown
    // onMouseDownCapture: keyboardHook.listProps.onMouseDownCapture,
    // onMouseLeave: handleMouseLeave,
    // onMouseMove: handleMouseMove
  };

  return {
    acceptSuggestion,
    focusVisible: keyboardHook.focusVisible,
    highlightedIdx,
    inputProps: editHook.inputProps,
    inputRef: editHook.inputRef,
    inputValue: editHook.value,
    isMultiSelect,
    keyBoardNavigation: keyboardHook.keyBoardNavigation,
    listProps,
    setIgnoreFocus: keyboardHook.setIgnoreFocus,
    setInputText: editHook.setInputText,
    suggestionProposed,
    suggestions,
    visibleData: dataHook.indexPositions
  };
};
