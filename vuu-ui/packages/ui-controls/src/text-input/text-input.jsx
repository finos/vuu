import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import cx from 'classnames';
import useControlled from '@vuu-ui/react-utils/src/use-controlled';

import './text-input.css';

const classBase = 'hwTextInput';

const TextInput = forwardRef(function TextInput(
  { className, defaultValue, onCancel, onChange, onCommit, value: valueProp, ...props },
  ref
) {
  const inputEl = useRef(null);
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? ''
  });

  const initialValue = useRef(valueProp ?? defaultValue);

  useImperativeHandle(ref, () => ({ focus }));

  const focus = () => {
    if (inputEl.current) {
      inputEl.current.focus();
      inputEl.current.select();
    }
  };

  const handleChange = (evt) => {
    const newValue = evt.target.value;
    setValue(newValue);
    onChange && onChange(evt, newValue);
  };

  const handleKeyDown = (e) => {
    const { key } = e;
    if (key === 'Enter') {
      commit();
    } else if (key === 'Escape') {
      setValue(initialValue.current);
      onCancel && onCancel();
    }
  };

  const handleBlur = () => {
    if (value !== initialValue.current) {
      commit();
    }
  };

  const commit = () => {
    initialValue.current = value;
    onCommit(value);
  };

  return (
    <input
      {...props}
      ref={inputEl}
      type="text"
      className={cx(classBase, className)}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
});

export default TextInput;
