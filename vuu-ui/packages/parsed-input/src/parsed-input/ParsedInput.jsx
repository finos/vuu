import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { Button, Dropdown, useItemsWithIds, useForkRef, SINGLE } from '@vuu-ui/ui-controls';
import { useId } from '@vuu-ui/react-utils';

import { SuggestionList } from './SuggestionList';
import { TokenMirror } from './TokenMirror';
import { useParsedInput } from './useParsedInput';
import { useParsedText } from './useParsedText';
import { getCompletion } from './input-utils';

import './ParsedInput.css';
const classBase = 'hwParsedInput';

export const ParsedInput = forwardRef(function ParsedInput({ id: idProp, onCommit }, ref) {
  const id = useId(idProp);

  const { result, errors, textRef, tokens, parseText, suggestions } = useParsedText();
  const root = useRef(null);
  const suggestionList = useRef(null);
  const suggestionsRef = useRef(suggestions);
  const { current: text } = textRef;
  const [selected, _setSelected] = useState([]);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const setSelected = useCallback((selected, updateHighlight = true) => {
    _setSelected(selected);
    if (updateHighlight) {
      setHighlightedIdx(0);
    }
  }, []);

  const setText = useCallback(
    (text, typedSubstitutionText) => {
      setSelected([]);
      // we need to pass an array of the substituted tokens, so we can map them beck to actual names
      parseText(text, typedSubstitutionText);
    },
    [parseText, setSelected]
  );

  const setCurrentText = useCallback(
    (content) => {
      textRef.current = content;
    },
    [textRef]
  );

  // To avoid circular dependency
  const acceptSuggestionRef = useRef();
  const selectionStrategyRef = useRef(SINGLE);

  const clear = useCallback(() => {
    setHighlightedIdx(0);
    setOpen(false);
    setText('');
  }, [setOpen, setText]);

  const handleCommit = useCallback(() => {
    onCommit && errors.length === 0 && onCommit(result);
    clear();
  }, [clear, errors.length, onCommit, result]);

  // need to find a way to clean this up - don't refresh suggestions whilst we're picking from a multi-select list
  const currentSuggestions =
    selectionStrategyRef.current !== SINGLE ? suggestionsRef.current : suggestions;
  const [totalItemCount, sourceWithIds] = useItemsWithIds(currentSuggestions, id);

  if (selectionStrategyRef.current === SINGLE) {
    suggestionsRef.current = suggestions;
  }

  const handleHighlightChange = useCallback((idx) => {
    setHighlightedIdx(idx);
  }, []);

  const handleTextInputChange = useCallback(
    (text) => {
      // const lastToken = lastWord(text);
      // if (suggestions.find((s) => s.value === lastToken)) {
      //   console.log(`we have a suggestion for ${lastToken} in ${text}`);
      // }
      // suggestionProposed.current = '';
      setText(text);
    },
    [setText]
  );

  const handleSuggestionClick = useCallback(
    (evt, selected) => {
      const updatedSelected = acceptSuggestionRef.current(evt, selected);
      if (updatedSelected) {
        setSelected(updatedSelected, false);
      }
    },
    [setSelected]
  );

  const handleSelectionChange = useCallback(
    (e, selected) => {
      if (selectionStrategyRef.current === SINGLE) {
        acceptSuggestionRef.current(e, selected);
      } else {
        // Hack alert ...acceptSuggestion when we have a multi-select returns the new selection
        const updatedSelected = acceptSuggestionRef.current(e, selected);
        setSelected(updatedSelected, false);
        if (updatedSelected.length === 0) {
          // restore default;
          selectionStrategyRef.current = SINGLE;
        }
      }
    },
    [setSelected]
  );

  const handleDropdownChange = useCallback((e, isOpen) => {
    if (e.type === 'blur' && suggestionList.current.contains(e.relatedTarget)) {
      // ignore click on list item
    } else {
      setOpen(isOpen);
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
    acceptSuggestion,
    inputProps,
    inputRef,
    inputValue,
    isMultiSelect,
    listProps,
    setInputText,
    suggestionProposed,
    visibleData
  } = useParsedInput({
    highlightedIdx: sourceWithIds.length === 0 ? -1 : highlightedIdx,
    onCommit: handleCommit,
    onDropdownClose: handleDropdownChange,
    onDropdownOpen: handleDropdownChange,
    onTextInputChange: handleTextInputChange,
    onSelectionChange: handleSelectionChange,
    onHighlight: handleHighlightChange,
    open,
    selected,
    setCurrentText,
    setHighlightedIdx,
    setText,
    sourceWithIds,
    textRef,
    totalItemCount
  });

  acceptSuggestionRef.current = acceptSuggestion;
  selectionStrategyRef.current = isMultiSelect ? 'checkbox-only' : SINGLE;

  const handleMouseOverSuggestion = useCallback((evt, idx) => {
    setHighlightedIdx(idx);
  }, []);

  // const { triggerHandlers: dropdownInputHandlers, isOpen } = useDropdown({
  //   open: suggestionsShowing,
  //   closeOnSelect: false,
  //   highlightedIdx,
  //   id,
  //   onDropdownChange: handleDropdownChange
  // });

  useEffect(() => {
    if (text !== inputValue) {
      requestAnimationFrame(() => {
        setInputText(text);
      });
    }
  }, [inputValue, setInputText, text]);

  const cursorAtEndOfText = !text.endsWith(' ');
  const [completion] = getCompletion(
    visibleData,
    highlightedIdx,
    cursorAtEndOfText,
    selected.length,
    true
  );

  return (
    <>
      <div className={cx(classBase)} ref={useForkRef(root, ref)}>
        <div className={`${classBase}-input-container`}>
          <TokenMirror tokens={tokens} completion={completion} />
          <div
            {...listProps}
            {...inputProps}
            ref={inputRef}
            contentEditable
            className={`${classBase}-input`}
            spellCheck={false}
            tabIndex={0}
          />
        </div>
        <Button className={`${classBase}-clear`} onClick={clear}>
          <span className={`hwIconContainer`} data-icon="close-circle" />
        </Button>
      </div>
      <Dropdown
        anchorEl={root.current}
        open={open}
        align="bottom-right"
        className={`${classBase}-dropdown`}>
        <SuggestionList
          highlightedIdx={highlightedIdx}
          id={id}
          onMouseEnterListItem={handleMouseOverSuggestion}
          onSuggestionClick={handleSuggestionClick}
          ref={suggestionList}
          selectionStrategy={selectionStrategyRef.current}
          selected={selected}
          suggestions={visibleData}
        />
      </Dropdown>
    </>
  );
});
