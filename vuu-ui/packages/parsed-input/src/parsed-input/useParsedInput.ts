import { SyntheticEvent, useCallback } from "react";
import {
  useDropdownBehaviour,
  useKeyboardNavigation,
} from "@vuu-ui/ui-controls";
import { useInputEditing } from "./useInputEditing";
import { useHierarchicalData } from "./use-hierarchical-data";

export interface ParsedInputHookProps {
  highlightedIdx: number;
  isMultiSelect?: boolean;
  onCommit?: () => void;
  onDropdownClose: (evt: SyntheticEvent, isOpen: boolean) => void;
  onDropdownOpen: (evt: SyntheticEvent, isOpen: boolean) => void;
  onTextInputChange: (text: string) => void;
  onHighlight: (highlightedIndex: number) => void;
  open: boolean;
  selected: any;
  sourceWithIds: any[];
}

export const useParsedInput = ({
  highlightedIdx,
  isMultiSelect = false,
  onCommit,
  onDropdownClose,
  onDropdownOpen,
  onTextInputChange,
  onHighlight,
  open,
  selected,
  sourceWithIds,
}: ParsedInputHookProps) => {
  const dataHook = useHierarchicalData(sourceWithIds, {
    isMultiSelect,
    selected,
  });
  const suggestionsAreIllustrationsOnly = dataHook.indexPositions.every(
    (item) => item.isIllustration
  );

  const dropdownHook = useDropdownBehaviour({
    open,
    onClose: onDropdownClose,
    onOpen: onDropdownOpen,
    openOnFocus: true,
  });

  const keyboardHook = useKeyboardNavigation({
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    onHighlight,
  });

  const editHook = useInputEditing({
    onChange: onTextInputChange,
    onCommit,
  });

  const handleKeyDown = useCallback(
    (evt) => {
      if (!suggestionsAreIllustrationsOnly) {
        dropdownHook.onKeyDown(evt);
        if (!evt.defaultPrevented) {
          keyboardHook.listProps.onKeyDown(evt);
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
      suggestionsAreIllustrationsOnly,
    ]
  );

  //TODO move to keyboard hook
  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : dataHook.indexPositions[highlightedIdx]?.id;

  const listProps = {
    "aria-activedescendant": getActiveDescendant(),
    onBlur: dropdownHook.onBlur,
    onFocus: dropdownHook.onFocus,
    onKeyDown: handleKeyDown,
  };

  return {
    // acceptSuggestion,
    inputProps: editHook.inputProps,
    inputRef: editHook.inputRef,
    inputValue: editHook.value,
    listProps,
    setInputText: editHook.setInputText,
    suggestionsAreIllustrationsOnly,
    visibleData: dataHook.indexPositions,
  };
};
