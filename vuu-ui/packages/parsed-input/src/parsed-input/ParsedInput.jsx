import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { Button, Dropdown, useItemsWithIds, useForkRef, SINGLE } from '@vuu-ui/ui-controls';
import { useId } from '@vuu-ui/react-utils';

import { SuggestionList } from './suggestions';
import { TokenMirror } from './TokenMirror';
import { useParsedInput } from './useParsedInput';
import { useParsedText } from './useParsedText';
import { getCompletionAtIndex } from './input-utils';

import './ParsedInput.css';
const classBase = 'hwParsedInput';

const NO_COMPLETION = [];

export const ParsedInput = forwardRef(function ParsedInput({ id: idProp, onCommit }, ref) {
  const id = useId(idProp);
  const {
    result,
    errors,
    textRef,
    tokens,
    parseText,
    suggestions: { values: suggestions, isMultiSelect },
    insertSymbol
  } = useParsedText();
  const { current: text } = textRef;

  console.log({ suggestions, isMultiSelect });

  const selectionStrategy = isMultiSelect ? 'checkbox-only' : SINGLE;

  const root = useRef(null);
  const suggestionList = useRef(null);
  // To avoid circular dependency
  const acceptSuggestionRef = useRef();
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
      // onsole.log(
      //   `ParsedInput setText text= '${text}' typedSubstitutionText= ${typedSubstitutionText}`
      // );
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

  const handleTextInputChange = useCallback(
    (text, char) => {
      if (char && char === insertSymbol) {
        setCurrentText(text);
      } else {
        setText(text);
      }
    },
    [insertSymbol, setCurrentText, setText]
  );

  const clear = useCallback(() => {
    setHighlightedIdx(0);
    setOpen(false);
    setText('');
  }, [setOpen, setText]);

  const handleCommit = useCallback(() => {
    onCommit && errors.length === 0 && onCommit(result);
    clear();
  }, [clear, errors.length, onCommit, result]);

  const [totalItemCount, sourceWithIds] = useItemsWithIds(suggestions, id, {
    label: 'ParsedInput'
  });

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
      const { current: acceptSuggestion } = acceptSuggestionRef;
      if (selectionStrategy === SINGLE) {
        acceptSuggestion(e, selected);
      } else {
        const selectedIds = acceptSuggestion(e, selected, insertSymbol);
        setSelected(selectedIds, false);
      }
    },
    [insertSymbol, selectionStrategy, setSelected]
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
    listProps,
    setInputText,
    suggestionsAreIllustrationsOnly,
    visibleData
  } = useParsedInput({
    highlightedIdx: sourceWithIds.length === 0 ? -1 : highlightedIdx,
    isMultiSelect,
    onCommit: handleCommit,
    onDropdownClose: handleDropdownChange,
    onDropdownOpen: handleDropdownChange,
    onTextInputChange: handleTextInputChange,
    onSelectionChange: handleSelectionChange,
    onHighlight: setHighlightedIdx,
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

  const handleMouseOverSuggestion = useCallback((evt, idx) => {
    setHighlightedIdx(idx);
  }, []);

  useEffect(() => {
    if (text !== inputValue) {
      requestAnimationFrame(() => {
        setInputText(text);
      });
    }
  }, [inputValue, setInputText, text]);

  const cursorAtEndOfText = !text.endsWith(' ');
  const [completion] = suggestionsAreIllustrationsOnly
    ? NO_COMPLETION
    : getCompletionAtIndex(visibleData, highlightedIdx, cursorAtEndOfText, selected.length, true);

  return (
    <>
      <div className={cx(classBase)} ref={useForkRef(root, ref)}>
        <div className={`${classBase}-input-container`}>
          <TokenMirror tokens={tokens} completion={`${insertSymbol ?? ''}${completion ?? ''}`} />
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
          highlightedIdx={suggestionsAreIllustrationsOnly ? -1 : highlightedIdx}
          id={id}
          onMouseEnterListItem={
            suggestionsAreIllustrationsOnly ? undefined : handleMouseOverSuggestion
          }
          onSuggestionClick={suggestionsAreIllustrationsOnly ? undefined : handleSuggestionClick}
          ref={suggestionList}
          selectionStrategy={selectionStrategy}
          selected={selected}
          suggestions={visibleData}
        />
      </Dropdown>
    </>
  );
});
