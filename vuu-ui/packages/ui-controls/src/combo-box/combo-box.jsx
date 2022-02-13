import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ComponentType, SelectBase } from '../select-base';

import './combo-box.css';

export default forwardRef(function ComboBox({ value = '', values, ...props }, ref) {
  const root = useRef(null);
  const [state, setState] = useState({ value, values });

  useImperativeHandle(ref, () => ({ focus }));

  // need to useEffect to detect value change from props

  function focus() {
    if (root.current) {
      root.current.focus(false);
    }
  }

  const handleChange = (evt) => {
    const value = evt.target.value;
    const values = matchingValues(value);
    setState({
      value,
      values
    });
  };

  const handleCommit = (value) => {
    const values = matchingValues(value);
    setState({
      value,
      values
    });

    if (props.onCommit) {
      props.onCommit(value);
    }
  };

  const matchingValues = (value) => {
    const pattern = new RegExp(`^${value}`, 'i');
    return values.filter((value) => pattern.test(value));
  };

  return (
    <SelectBase
      {...props}
      ref={root}
      value={state.value}
      source={state.values}
      onCommit={handleCommit}>
      {(child) =>
        child === ComponentType.Input && (
          <input type="text" className="hwCombobox" onChange={handleChange} value={state.value} />
        )
      }
    </SelectBase>
  );
});
