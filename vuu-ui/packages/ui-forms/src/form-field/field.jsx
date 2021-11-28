import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import cx from 'classnames';
import Control from '../control';

export default forwardRef(function Field(
  {
    field,
    leg,
    model,
    onCancel,
    onChange,
    onClickCapture,
    onCommit,
    onFocusControl,
    onKeyDown,
    render
  },
  ref
) {
  const control = useRef(null);
  const [popupActive] = useState(false);

  const isComposite = Array.isArray(field.type);

  useImperativeHandle(ref, () => ({ field, focus }));

  function focus(idx) {
    if (control.current && control.current.focus) {
      control.current.focus(idx);
    }
  }

  const handleClickCapture = (_, compositeFieldIdx) => onClickCapture(field, compositeFieldIdx);
  const handleCancel = () => onCancel(field);
  const handleCommit = () => onCommit(field);
  const handleFocus = (evt, controlIdx = 0) => onFocusControl(evt, field, controlIdx);

  function renderChild() {
    if (field.type === 'empty') {
      return <div className="empty" />;
    }
    let child = render(field, leg, model, onChange);

    const props = {
      ref: control,
      onCancel: handleCancel,
      // onPopupActive: setPopupActive,
      onFocus: handleFocus,
      onClickCapture: isComposite ? handleClickCapture : undefined
    };

    if (child.props.onCommit) {
      const _commit = child.props.onCommit;
      props.onCommit = (value) => {
        handleCommit();
        _commit(value);
      };
    } else {
      props.onCommit = handleCommit;
    }

    return <Control tabIdx={field.tabIdx}>{React.cloneElement(child, props)}</Control>;
  }

  const className = cx('field', {
    'popup-active': popupActive
  });

  return (
    <div
      className={className}
      data-idx={field.tabIdx}
      onClickCapture={isComposite ? undefined : handleClickCapture}
      onKeyDownCapture={onKeyDown}
    >
      {renderChild()}
    </div>
  );
});
