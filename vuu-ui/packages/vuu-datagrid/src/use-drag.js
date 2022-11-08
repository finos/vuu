import { useCallback, useRef, useEffect } from 'react';

const DRAG_THRESHOLD = 3;

export const DRAG_START = 1;
export const DRAG = 4;
export const DRAG_PAUSE = 8;
export const DRAG_END = 2;

const DRAG_DEFAULT = DRAG_START + DRAG + DRAG_END;

export function useDragStart(callback) {
  return useDrag(callback, DRAG_START);
}

/** @type {DragHook} */
export default function useDrag(callback, dragPhase = DRAG_DEFAULT, initialDragPosition = -1) {
  // Note: If user is not tracking 'drag-start', it's assumed that we're already dragging

  let cleanUp;
  const disabled = useRef(false);
  const dragging = useRef(false);
  const position = useRef({ x: initialDragPosition, y: -1 });
  const onMouseMove = useRef(null);
  const onMouseUp = useRef(null);
  const timeoutHandle = useRef(null);

  onMouseUp.current = useCallback(() => {
    if (dragging.current) {
      callback('drag-end');
    }
    cleanUp();
  }, [callback, cleanUp]);

  const pauseListener = useCallback(() => {
    callback('drag-pause');
  }, [callback]);

  onMouseMove.current = useCallback(
    (e) => {
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }
      const x = e.clientX;
      const y = e.clientY;
      const deltaX = x - position.current.x;

      if (dragging.current) {
        position.current.x = x;
        position.current.y = y;
        callback('drag', deltaX, position.current.x);
      } else if (dragPhase & DRAG_START) {
        if (Math.abs(deltaX) > DRAG_THRESHOLD) {
          dragging.current = true;
          position.current.x = x;
          position.current.y = y;

          callback('drag-start', deltaX, position.current.x);
          if (dragPhase === DRAG_START) {
            cleanUp();
          }
        }
      } else {
        // if we are tracking drag only, we're going to miss the first drag callback as we have to
        // establish our start point before we can begin to derive deltas.
        dragging.current = true;
        position.current.x = x;
        position.current.y = y;
      }

      if (dragPhase & DRAG_PAUSE) {
        if (timeoutHandle.current) {
          clearTimeout(timeoutHandle.current);
          timeoutHandle.current = null;
        }

        timeoutHandle.current = setTimeout(pauseListener, 300);
      }
    },
    [callback, cleanUp, dragPhase, pauseListener]
  );

  // Important that these never change for the lifetime of the hook, as they are
  // used to register and register window listeners.
  const mouseMoveHandler = useCallback((e) => onMouseMove.current(e), []);
  const mouseUpHandler = useCallback((e) => onMouseUp.current(e), []);

  function leftMouseButton(e) {
    if ('buttons' in e) {
      return e.buttons == 1;
    }
    var button = e.which || e.button;
    return button == 1;
  }
  const handleMouseDown = useCallback(
    (e) => {
      if (leftMouseButton(e)) {
        position.current = { x: e.clientX, y: e.clientY };
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('mousemove', mouseMoveHandler);
      }
    },
    [mouseMoveHandler, mouseUpHandler]
  );

  useEffect(() => {
    // We don't normally expect the callback to change during the lifetime of a drag operation.
    // Because the drag takes immediate effect if drag-start is not being monitored, we provide
    // a way to disable drag under clients control, in case callback does change under
    // circumstances that should not trigger immediate drag monitoring.
    if (!(dragPhase & DRAG_START)) {
      if (dragPhase & DRAG && !dragging.current && !disabled.current) {
        window.addEventListener('mousemove', mouseMoveHandler);

        if (dragPhase & DRAG_END) {
          window.addEventListener('mouseup', mouseUpHandler);
        }
        dragging.current = true;
      }
      if (dragPhase & DRAG_END && !dragging.current && !disabled.current) {
        window.addEventListener('mouseup', mouseUpHandler);
        dragging.current = true;
      }
    }
  }, [callback, dragPhase, mouseMoveHandler, mouseUpHandler]);

  // TODO extend cleanup to rest references, but careful of order of operations in handlers
  cleanUp = useCallback(() => {
    window.removeEventListener('mouseup', mouseUpHandler);
    window.removeEventListener('mousemove', mouseMoveHandler);
    dragging.current = false;
  }, [mouseMoveHandler, mouseUpHandler]);

  const disable = useCallback(() => {
    cleanUp();
    disabled.current = true;
  }, [cleanUp]);

  return [handleMouseDown, disable];
}
