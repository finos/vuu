import { useCallback } from 'react';
import {
  useDropdownBehaviour,
  useHierarchicalData,
  useKeyboardNavigation,
  useSelection
} from '@vuu-ui/ui-controls';
import { useInputEditing } from './use-input-editing';
import { useSuggestions } from './suggestions';

const ENTER_ONLY = ['Enter'];

export const useParsedInput = ({
  highlightedIdx,
  id,
  isMultiSelect,
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
  const dataHook = useHierarchicalData(sourceWithIds, 'ParsedInput');

  console.log({ sourceWithIds });

  const suggestionsAreIllustrationsOnly = dataHook.indexPositions.every(
    (item) => item.isIllustration
  );

  const dropdownHook = useDropdownBehaviour({
    open,
    onClose: onDropdownClose,
    onOpen: onDropdownOpen,
    openOnFocus: true
  });

  const { acceptSuggestion } = useSuggestions({
    isMultiSelect,
    onCommit,
    selected,
    setCurrentText,
    setHighlighted: setHighlightedIdx,
    setText,
    setVisibleData: dataHook.setData,
    textRef,
    indexPositions: dataHook.indexPositions
  });

  const keyboardHook = useKeyboardNavigation({
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    id,
    label: 'ParsedInput',
    onHighlight
  });

  const selectionHook = useSelection({
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    label: 'useParsedInput',
    onChange: onSelectionChange,
    selected,
    selection: isMultiSelect ? 'checkbox' : 'single',
    selectionKeys: ENTER_ONLY
  });

  const editHook = useInputEditing({
    onChange: onTextInputChange,
    onCommit
  });

  const handleKeyDown = useCallback(
    (evt) => {
      if (!suggestionsAreIllustrationsOnly) {
        dropdownHook.onKeyDown(evt);
        if (!evt.defaultPrevented) {
          keyboardHook.listProps.onKeyDown(evt);
        }
        if (!evt.defaultPrevented) {
          selectionHook.listHandlers.onKeyDown?.(evt);
        }
      }
      if (!evt.defaultPrevented) {
        editHook.handleKeyDown?.(evt);
      }
    },
    [
      dropdownHook,
      editHook,
      keyboardHook.listProps,
      selectionHook.listHandlers,
      suggestionsAreIllustrationsOnly
    ]
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
  };

  return {
    acceptSuggestion,
    inputProps: editHook.inputProps,
    inputRef: editHook.inputRef,
    inputValue: editHook.value,
    listProps,
    setInputText: editHook.setInputText,
    suggestionsAreIllustrationsOnly,
    visibleData: dataHook.indexPositions
  };
};
