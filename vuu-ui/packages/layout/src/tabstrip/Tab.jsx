// TODO close button needs to be a butotn. Hence tab needs to include 2 buttons
import React, { forwardRef, useRef, useState } from 'react';
import cx from 'classnames';
import { Button } from '@vuu-ui/ui-controls';
import { useForkRef } from '../utils';
import { EditableLabel } from '../editable-label';

import './Tab.css';

const Tab = forwardRef(function Tab(
  {
    ariaControls,
    deletable,
    draggable,
    editable,
    selected,
    index,
    label: labelProp,
    onClick,
    onDelete,
    onKeyDown,
    onKeyUp,
    onEdit,
    onMouseDown,
    orientation,
    ...props
  },
  ref
) {
  const root = useRef(null);
  const setRef = useForkRef(ref, root);
  const [closeHover, setCloseHover] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [label, setLabel] = useState(labelProp);
  const classRoot = 'hwTab';
  const handleClick = (e) => {
    e.preventDefault();
    onClick(e, index);
  };
  const handleKeyDown = (e) => {
    onKeyDown(e, index);
  };
  const handleKeyUp = (e) => {
    switch (e.key) {
      case 'Delete':
        if (deletable) {
          e.stopPropagation();
          onDelete(e, index);
        }
        break;
      default:
        onKeyUp(e, index);
    }
  };

  const handleCloseButtonClick = (e) => {
    e.stopPropagation();
    onDelete(e, index);
  };

  const handleCloseButtonEnter = () => {
    setCloseHover(true);
  };

  const handleCloseButtonLeave = () => {
    setCloseHover(false);
  };

  const handleMouseDown = (e) => {
    onMouseDown && onMouseDown(e, index);
  };

  const handleEnterEditMode = () => setEditMode(true);

  const handleExitEditMode = (evt, editedLabel) => {
    setEditMode(false);
    setLabel(editedLabel);
    if (evt.key === 'Enter') {
      root.current.focus();
    }
    onEdit && onEdit(evt, index, editedLabel);
  };

  const getLabel = () => {
    if (editable) {
      return (
        <EditableLabel
          value={label}
          onEnterEditMode={handleEnterEditMode}
          onExitEditMode={handleExitEditMode}
        />
      );
    } else {
      return label;
    }
  };

  // TODO is it ok for the close button to be a span ?
  // button cannot be nested within button. toolkit
  // uses side-by-side buttons
  return (
    <button
      {...props}
      aria-controls={ariaControls}
      aria-selected={selected}
      className={cx(classRoot, {
        [`${classRoot}-selected`]: selected,
        [`${classRoot}-closeable`]: deletable,
        [`${classRoot}-closeHover`]: closeHover,
        [`${classRoot}-editing`]: editMode,
        [`${classRoot}-vertical`]: orientation === 'vertical'
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      ref={setRef}
      role="tab"
      tabIndex={selected ? undefined : -1}>
      <span className={`${classRoot}-text`} data-text={label} role="button">
        {getLabel()}
      </span>
      {deletable ? (
        <Button
          aria-label="close"
          element="div"
          onClick={handleCloseButtonClick}
          onMouseEnter={handleCloseButtonEnter}
          onMouseLeave={handleCloseButtonLeave}
        />
      ) : null}
    </button>
  );
});

export default Tab;
