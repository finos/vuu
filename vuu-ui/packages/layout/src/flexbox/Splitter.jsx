import React, { useCallback, useRef, useState } from 'react';
import cx from 'classnames';

import './Splitter.css';

const Splitter = React.memo(function Splitter({
  column,
  index,
  onDrag,
  onDragEnd,
  onDragStart,
  style
}) {
  const ignoreClick = useRef(null);
  const rootRef = useRef(null);
  const lastPos = useRef(null);

  const [active, setActive] = useState(false);

  const handleKeyDownDrag = useCallback(
    ({ key, shiftKey }) => {
      // TODO calc max distance
      const distance = shiftKey ? 10 : 1;
      if (column && key === 'ArrowDown') {
        onDrag(index, distance);
      } else if (column && key === 'ArrowUp') {
        onDrag(index, -distance);
      } else if (!column && key === 'ArrowLeft') {
        onDrag(index, -distance);
      } else if (!column && key === 'ArrowRight') {
        onDrag(index, distance);
      }
    },
    [column, index, onDrag]
  );

  const handleKeyDownInitDrag = useCallback(
    (evt) => {
      const { key } = evt;
      const horizontalMove = key === 'ArrowLeft' || key === 'ArrowRIght';
      const verticalMove = key === 'ArrowUp' || key === 'ArrowDown';
      if ((column && verticalMove) || (!column && horizontalMove)) {
        onDragStart(index);
        handleKeyDownDrag(evt);
        keyDownHandlerRef.current = handleKeyDownDrag;
      }
    },
    [column, handleKeyDownDrag, index, onDragStart]
  );

  const keyDownHandlerRef = useRef(handleKeyDownInitDrag);
  const handleKeyDown = (evt) => keyDownHandlerRef.current(evt);

  const handleMouseMove = useCallback(
    (e) => {
      ignoreClick.current = true;
      const pos = e[column ? 'clientY' : 'clientX'];
      const diff = pos - lastPos.current;
      // we seem to get a final value of zero
      if (pos && pos !== lastPos.current) {
        onDrag(index, diff);
      }
      lastPos.current = pos;
    },
    [column, index, onDrag]
  );

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove, false);
    window.removeEventListener('mouseup', handleMouseUp, false);
    onDragEnd();
    setActive(false);
    rootRef.current.focus();
  }, [handleMouseMove, onDragEnd, setActive]);

  const handleMouseDown = useCallback(
    (e) => {
      lastPos.current = column ? e.clientY : e.clientX;
      onDragStart(index);
      window.addEventListener('mousemove', handleMouseMove, false);
      window.addEventListener('mouseup', handleMouseUp, false);
      e.preventDefault();
      setActive(true);
    },
    [column, handleMouseMove, handleMouseUp, index, onDragStart, setActive]
  );

  const handleFocus = () => {
    // TODO
  };

  const handleClick = () => {
    if (ignoreClick.current) {
      ignoreClick.current = false;
    } else {
      rootRef.current.focus();
    }
  };

  const handleBlur = () => {
    // TODO
    keyDownHandlerRef.current = handleKeyDownInitDrag;
  };

  const className = cx('Splitter', 'focusable', { active, column });
  return (
    <div
      className={className}
      data-splitter
      ref={rootRef}
      role="separator"
      style={style}
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      <div className="grab-zone" />
    </div>
  );
});

export default Splitter;
