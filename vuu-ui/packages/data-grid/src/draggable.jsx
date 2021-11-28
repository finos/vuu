//TODO use useDrag
import React, { useRef, useCallback } from 'react';

const NOOP = () => {};

/** @type {DraggableComponent} */
const Draggable = (allProps) => {
  let cleanUp;
  const { children: child, onDrag, onDragEnd = NOOP, onDragStart = NOOP, ...props } = allProps;

  const position = useRef({ x: 0, y: 0 });
  const dragState = useRef(null);

  const handleMouseDown = (e) => {
    // what is dragState supposed to be exactly ?
    const newDragState = onDragStart(e);
    if (newDragState === null && e.button !== 0) {
      return;
    }

    position.current.x = e.clientX;
    position.current.y = e.clientY;

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    dragState.current = newDragState;

    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.preventDefault) {
      e.preventDefault();
    }
  };

  const onMouseMove = useCallback(
    (e) => {
      if (dragState.current === null) {
        return;
      }

      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      const x = e.clientX;
      const y = e.clientY;

      const deltaX = x - position.current.x;
      const deltaY = y - position.current.y;

      position.current.x = x;
      position.current.y = y;

      onDrag(e, deltaX, deltaY);
    },
    [onDrag]
  );

  const onMouseUp = useCallback(
    (e) => {
      cleanUp();
      onDragEnd(e, dragState.current); // seems we pass back whatever was passed in drag start ???
      dragState.current = null;
    },
    [cleanUp, onDragEnd]
  );

  cleanUp = useCallback(() => {
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
  }, [onMouseMove, onMouseUp]);

  if (child && React.isValidElement(child)) {
    return React.cloneElement(child, { ...props, onMouseDown: handleMouseDown });
  } else {
    return <div onMouseDown={handleMouseDown} {...props} />;
  }
};

export default Draggable;
