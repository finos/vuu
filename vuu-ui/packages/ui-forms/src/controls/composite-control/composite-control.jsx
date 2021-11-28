import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import './composite-control.css';

export default forwardRef(function CompositeControl(
  {
    children: nestedControls,
    field,
    onCancel,
    onClickCapture,

    onCommit,
    onFocus
  },
  ref
) {
  const [value, setValue] = useState(nestedControls.map((child) => child.props.value));
  const childRefs = useRef([]);

  useImperativeHandle(ref, () => ({ focus }));

  function focus(idx = 0) {
    const component = childRefs.current[idx];
    if (component && component.focus) {
      component.focus();
    }
  }

  const setRef = (c, idx) => (childRefs.current[idx] = c);

  function handleCommit(newValue, idx, controlCommitCallback) {
    console.log(`composite (${field.id}) commit ${idx}`);
    const newValues = [...value];
    newValues[idx] = newValue;
    setValue(newValues);
    controlCommitCallback(newValues);
    onCommit(field);
  }

  return (
    <div className="composite-control">
      {nestedControls.map((child, idx) => {
        const props = {
          ref: (c) => setRef(c, idx),
          onFocus: (evt) => onFocus(evt, idx),
          // onPopupActive,
          onCancel
        };
        if (child.props.onCommit) {
          const _commit = child.props.onCommit;
          props.onCommit = (value) => {
            handleCommit(value, idx, _commit);
          };
        } // suppose it doesn't have commit, shouldn't we commit anyway ?
        const component = React.cloneElement(child, props);

        const handleClickCapture = (e) => {
          onClickCapture(e, idx);
        };

        return (
          <div className="composite-item" key={idx} onClickCapture={handleClickCapture}>
            {component}
          </div>
        );
      })}
    </div>
  );
});
