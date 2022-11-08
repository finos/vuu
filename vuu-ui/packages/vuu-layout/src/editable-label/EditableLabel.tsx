import React, { ChangeEvent, FocusEvent, HTMLAttributes, KeyboardEvent, MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import cx from 'classnames';

import './EditableLabel.css';

export interface EditableLabelProps extends HTMLAttributes<HTMLDivElement>{
  onEnterEditMode?: (evt: MouseEvent) => void;
  onExitEditMode?: (evt: FocusEvent | KeyboardEvent, value: string) => void;
  value: string;
}

const EditableLabel = ({
  className: classNameProp,
  onEnterEditMode,
  onExitEditMode,
  value: valueProp
}: EditableLabelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const isEditing = useRef(false);
  const [value, setValue] = useState(valueProp);
  const classBase = 'hwEditableLabel';

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.select();
      inputRef.current?.focus();
    }
  }, [editing, inputRef]);

  const enterEditMode = (evt: MouseEvent) => {
    if (!isEditing.current) {
      setEditing((isEditing.current = true));
      onEnterEditMode && onEnterEditMode(evt);
    }
  };

  const exitEditMode = (evt: FocusEvent | KeyboardEvent) => {
    if (isEditing.current) {
      setEditing((isEditing.current = false));
      onExitEditMode && onExitEditMode(evt, value);
    }
  };

  const handleChange = (evt: ChangeEvent) => {
    evt.stopPropagation();
    setValue((evt.target as HTMLInputElement).value);
  };

  const handleDoubleClick = (evt: MouseEvent<HTMLSpanElement>) => {
    enterEditMode(evt);
  };

  const handleBlur = (evt: FocusEvent<HTMLInputElement>) => {
    exitEditMode(evt);
  };

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
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

  const handleKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
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
