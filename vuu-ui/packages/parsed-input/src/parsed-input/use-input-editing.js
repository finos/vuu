import { useCallback, useRef } from 'react';
import { isCharacterKey, isQuoteKey } from '@vuu-ui/utils';

export const useInputEditing = ({ onCommit, onChange }) => {
  const inputRef = useRef(null);

  const handleKeyDown = useCallback(
    (evt) => {
      const value = inputRef.current.textContent;
      const key = evt.key;
      if (key === 'Shift') {
        // do nothing
      } else if (key === 'Backspace') {
        // TODO need to take caret position into account
        // Need special treatment where character removed is an 'auto-inserted'
        // character. We don't want it to be immediately auto inserted again
        // TODO how do we identify this class of characters ?
        const lastChar = value.slice(-1);
        if (lastChar === '[') {
          onChange(`${value.slice(0, -2)}`);
        } else {
          onChange(`${value.slice(0, -1)}`);
        }
      } else if (key === 'Enter') {
        evt.preventDefault();
        onCommit && onCommit();
      } else if (isCharacterKey(evt) || isQuoteKey(key)) {
        onChange(`${value}${key}`);
      }
    },
    [onChange, onCommit]
  );

  const setCaretPosition = useCallback(
    (pos) => {
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(inputRef.current?.firstChild ?? inputRef.current, pos);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    },
    [inputRef]
  );

  const setInputText = useCallback(
    (text) => {
      inputRef.current.textContent = text;
      setCaretPosition(text.length);
    },
    [setCaretPosition]
  );

  const inputProps = {
    onPaste: (evt) => {
      evt.preventDefault();
      // TODO take selection, caret position into account
      const text = evt.clipboardData.getData('text');
      inputRef.current.textContent = text;
      onChange(text);
      requestAnimationFrame(() => {
        setCaretPosition(text.length);
      });
    }
  };

  const value = inputRef.current?.textContent ?? '';

  return {
    inputProps,
    inputRef,
    handleKeyDown,
    setCaretPosition,
    setInputText,
    value
  };
};
