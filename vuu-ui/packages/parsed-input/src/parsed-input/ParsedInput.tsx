import { useIdMemo as useId } from "@heswell/uitk-core";
import { Dropdown } from "@heswell/uitk-lab";
import { Filter } from "@vuu-ui/vuu-filters";
import { useItemsWithIds } from "@vuu-ui/ui-controls";
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  SyntheticEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from "react";
import { FilterInput } from "./FilterInput";
import {
  useSuggestions,
  itemToString,
  SuggestionListItem,
} from "./suggestions";

import { getCompletionAtIndex } from "./input-utils";
import { useParsedInput } from "./useParsedInput";
import { useParsedText } from "./useParsedText";

import { SelectionChangeHandler, SelectionStrategy } from "@heswell/uitk-lab";
import { SuggestionItem } from "@vuu-ui/datagrid-parsers";

import "./ParsedInput.css";

const NO_COMPLETION = [] as const;

export interface ParsedInputProps extends HTMLAttributes<HTMLDivElement> {
  onCommit?: (parsedFilter: Filter) => void;
}

export type FocusAPI = {
  focus: () => void;
};

export const ParsedInput = forwardRef(function ParsedInput(
  { id: idProp, onCommit }: ParsedInputProps,
  forwardedRef: ForwardedRef<FocusAPI>
) {
  const id = useId(idProp);
  const {
    hasErrors,
    insertSymbol,
    parseText,
    result,
    suggestions: { values: suggestions, isMultiSelect },
    textRef,
    tokens,
  } = useParsedText();

  const { current: text } = textRef;
  const selectionStrategy: SelectionStrategy = isMultiSelect
    ? "multiple"
    : "default";

  const canCommit = () => false;

  const [selected, _setSelected] = useState<any[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useImperativeHandle(forwardedRef, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const setSelected = useCallback((selected, updateHighlight = true) => {
    _setSelected(selected);
    if (updateHighlight) {
      setHighlightedIdx(0);
    }
  }, []);

  const setText = useCallback(
    (text: string, typedSubstitutionText?: string) => {
      setSelected(null);
      parseText(text, typedSubstitutionText);
    },
    [parseText, setSelected]
  );

  const setCurrentText = useCallback(
    (text: string) => {
      textRef.current = text;
    },
    [textRef]
  );

  const handleTextInputChange = useCallback(
    (text: string) => {
      setText(text);
    },
    [setText]
  );

  const clear = useCallback(() => {
    setHighlightedIdx(0);
    setOpen(false);
    setText("");
  }, [setOpen, setText]);

  const handleCommit = useCallback(() => {
    !hasErrors && result && onCommit?.(result);
    clear();
  }, [clear, hasErrors, onCommit, result]);

  const [totalItemCount, sourceWithIds] = useItemsWithIds(suggestions, id);

  const { acceptSuggestion } = useSuggestions<typeof selectionStrategy>({
    selectionStrategy,
    onCommit: canCommit() ? handleCommit : undefined,
    setCurrentText,
    setText,
    textRef,
  });

  const handleMultipleSuggestionSelection: SelectionChangeHandler<
    SuggestionItem,
    "multiple"
  > = useCallback(
    (evt: SyntheticEvent, selectedSuggestions: SuggestionItem[]) => {
      acceptSuggestion?.(evt, selectedSuggestions, insertSymbol);
      setSelected(selectedSuggestions, false);
    },
    [acceptSuggestion, insertSymbol, setSelected]
  );

  const handleSingleSuggestionSelection: SelectionChangeHandler<
    SuggestionItem,
    "default"
  > = useCallback(
    (evt: SyntheticEvent, selectedSuggestion: SuggestionItem | null) => {
      if (selectedSuggestion?.value === "EOF") {
        handleCommit();
      } else if (selectedSuggestion !== null) {
        acceptSuggestion?.(evt, selectedSuggestion);
      }
    },
    [acceptSuggestion, handleCommit]
  );

  const handleDropdownChange = useCallback((isOpen: boolean, reason) => {
    {
      if (reason !== "selection") {
        setOpen(isOpen);
      }
    }
    // if (!isOpen) {
    //   setSelected([]);
    // }
  }, []);

  useEffect(() => {
    if (open) {
      setText(textRef.current);
    }
  }, [open, setText, textRef]);

  const {
    inputProps,
    inputRef,
    inputValue,
    listProps,
    setInputText,
    suggestionsAreIllustrationsOnly,
    visibleData,
  } = useParsedInput({
    highlightedIdx: sourceWithIds.length === 0 ? -1 : highlightedIdx,
    isMultiSelect,
    onCommit: canCommit() ? handleCommit : undefined,
    onDropdownClose: handleDropdownChange,
    onDropdownOpen: handleDropdownChange,
    onTextInputChange: handleTextInputChange,
    // onSelectionChange: handleSelectionChange,
    onHighlight: setHighlightedIdx,
    open,
    selected: isMultiSelect ? selected : null,
    sourceWithIds,
  });

  const selectedItems = visibleData.filter((item) => item.isSelected);
  const selectedIdValues = selectedItems.map((item) => item.id);
  const selectedCount = selectedIdValues.length;

  useLayoutEffect(() => {
    setHighlightedIdx(selectedCount);
  }, [selectedCount]);

  const handleMouseOverSuggestion = useCallback((index: number) => {
    setHighlightedIdx(index);
  }, []);

  useEffect(() => {
    if (text !== inputValue) {
      requestAnimationFrame(() => {
        setInputText(text);
      });
    }
  }, [inputValue, setInputText, text]);

  const cursorAtEndOfText = !text.endsWith(" ");
  const [completion] = suggestionsAreIllustrationsOnly
    ? NO_COMPLETION
    : getCompletionAtIndex(
        visibleData,
        highlightedIdx,
        cursorAtEndOfText,
        selectedIdValues.length,
        true
      );

  const filterInput = (
    <FilterInput
      {...listProps}
      {...inputProps}
      completion={`${insertSymbol ?? ""}${completion ?? ""}`}
      inputRef={inputRef}
      tokens={tokens}
    />
  );

  return (
    <Dropdown<SuggestionItem, typeof selectionStrategy>
      ListItem={SuggestionListItem}
      ListProps={{
        highlightedIndex: suggestionsAreIllustrationsOnly ? -1 : highlightedIdx,
        onHighlight: handleMouseOverSuggestion,
      }}
      className="vuuParsedInput"
      fullWidth
      isOpen={open}
      itemToString={itemToString}
      onOpenChange={handleDropdownChange}
      onSelectionChange={
        suggestionsAreIllustrationsOnly
          ? undefined
          : isMultiSelect
          ? handleMultipleSuggestionSelection
          : handleSingleSuggestionSelection
      }
      selected={isMultiSelect ? selectedItems : null}
      selectionStrategy={selectionStrategy}
      style={{ width: "100%" }}
      source={visibleData}
      triggerComponent={filterInput}
    />
  );
});
