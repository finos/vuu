import React, { useLayoutEffect, useRef, useState } from 'react';
import cx from 'classnames';

import './EditableLabel.css';

const EditableLabel = ({
  className: classNameProp,
  onEnterEditMode,
  onExitEditMode,
  value: valueProp
}) => {
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const isEditing = useRef(false);
  const [value, setValue] = useState(valueProp);
  const classBase = 'hwEditableLabel';

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current.select();
      inputRef.current.focus();
    }
  }, [editing, inputRef]);

  const enterEditMode = (evt) => {
    if (!isEditing.current) {
      setEditing((isEditing.current = true));
      onEnterEditMode && onEnterEditMode(evt);
    }
  };

  const exitEditMode = (evt) => {
    if (isEditing.current) {
      setEditing((isEditing.current = false));
      onExitEditMode && onExitEditMode(evt, value);
    }
  };

  const handleChange = (evt) => {
    evt.stopPropagation();
    setValue(evt.target.value);
  };

  const handleDoubleClick = (evt) => {
    enterEditMode(evt);
  };

  const handleBlur = (evt) => {
    exitEditMode(evt);
  };

  const handleKeyDown = (evt) => {
    evt.stopPropagation();
    if (evt.key === 'Enter') {
      exitEditMode(evt);
    } else if (evt.key === 'ArrowRight' || evt.key === 'ArrowLeft') {
      evt.stopPropagation();
    } else if (evt.key === 'Escape') {
      // TODO restore original value
      exitEditMode(evt);
    }
  };

  const handleKeyUp = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
  };

  const className = cx(classBase, classNameProp, {
    [`${classBase}-editing`]: editing
  });

  return (
    <span className={className} onDoubleClick={handleDoubleClick} data-text={value}>
      {editing ? (
        <input
          className={`${classBase}-input`}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          ref={inputRef}
          style={{ padding: 0 }}
        />
      ) : (
        value
      )}
    </span>
  );
};

export default EditableLabel;
