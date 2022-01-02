import { useCallback, useRef, useState } from 'react';
import {
  dimensions,
  measureDragThresholds,
  measureElementSize,
  nextThreshold,
  prevThreshold
} from './drag-utils';

const dragThreshold = 3;

export const useDragDrop = ({ allowDragDrop, onDrop, orientation, containerRef, itemQuery }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef(0);
  const previousPos = useRef(0);
  const isScrollable = useRef(false);
  const isScrolling = useRef(false);
  const containerSize = useRef(0);
  const mouseOffset = useRef(0);
  const startOffset = useRef(0);
  const dragLimits = useRef({ start: 0, end: 0 });
  const scrollTimer = useRef(null);
  const draggable = useRef({ element: null, fromIndex: -1, pos: 0, size: 0 });
  const target = useRef({ element: null, isLast: false });
  const dragThresholds = useRef([]);

  const clearTarget = useCallback(
    (element) => {
      const { START, END } = dimensions(orientation);
      if (element === null) {
        // we've reached the last item
        element.style.cssText = `margin-${START}: 0px;  margin-${END}: ${draggable.current.size}px;`;
      } else {
        element.style.cssText = `margin-${START}: 0px; margin-${END}: 0px;`;
      }
    },
    [orientation]
  );

  const resetCurrentTarget = useCallback(
    (direction) => {
      const { START, END } = dimensions(orientation);
      clearTarget(target.current.element);
      if (direction === 'fwd') {
        target.current.element = containerRef.current.lastChild;
        target.current.isLast = true;
        target.current.element.style.cssText = `margin-${START}: 0px;  margin-${END}: ${draggable.current.size}px; `;
      } else {
        target.current.element = containerRef.current.firstChild;
        target.current.isLast = false;
        target.current.element.style.cssText = `margin-${START}:  ${draggable.current.size}px;  margin-${END}: 0px; `;
      }
    },
    [clearTarget, containerRef, orientation]
  );

  const setCurrentTarget = useCallback(
    (element) => {
      const { START, END } = dimensions(orientation);
      element.style.cssText = `margin-${START}: ${draggable.current.size}px; margin-${END}: 0px; `;
      target.current.element = element;
      target.current.isLast = false;
    },
    [orientation]
  );

  const setCurrentTargetLast = useCallback(
    (element) => {
      const { END } = dimensions(orientation);
      element.style.cssText = `margin-${END}: ${draggable.current.size}px; `;
      target.current.isLast = true;
      target.current.element = element;
    },
    [orientation]
  );

  const displaceElementAtIndex = useCallback(
    (index) => {
      const {
        current: { element: currentElement, isLast }
      } = target;
      const threshold = dragThresholds.current[index];
      // clearing the existing target first avoids a brief scrollbar flash.
      if (currentElement && !isLast) {
        if (threshold?.element === undefined) {
          target.current.element = currentElement;
          target.current.isLast = true;
        }
        clearTarget(currentElement);
      }

      if (threshold) {
        setCurrentTarget(threshold.element);
      } else {
        const lastIndex = dragThresholds.current.length - 1;
        const { element } = dragThresholds.current[lastIndex];
        setCurrentTargetLast(element);
      }
    },
    [clearTarget, setCurrentTarget, setCurrentTargetLast]
  );

  const handleDragStart = useCallback(() => {
    dragThresholds.current = measureDragThresholds(
      containerRef.current,
      orientation,
      draggable.current
    );
    setIsDragging(true);
  }, [containerRef, orientation]);

  const getScrollDirection = useCallback(
    (mousePos) => {
      const { SCROLL_POS, SCROLL_SIZE, CLIENT_SIZE } = dimensions(orientation);
      const {
        [SCROLL_POS]: scrollPos,
        [SCROLL_SIZE]: scrollSize,
        [CLIENT_SIZE]: clientSize
      } = containerRef.current;
      const maxScroll = scrollSize - clientSize;
      const canScrollFwd = scrollPos < maxScroll;
      const viewportEnd = startOffset.current + containerSize.current;
      const bwd = scrollPos > 0 && mousePos - mouseOffset.current <= startOffset.current;
      const fwd =
        canScrollFwd && mousePos + draggable.current.size - mouseOffset.current >= viewportEnd;
      return bwd ? 'bwd' : fwd ? 'fwd' : '';
    },
    [containerRef, orientation]
  );

  const handleDragEnd = useCallback(
    (fromIndex, toIndex) => {
      onDrop(fromIndex, toIndex);
      requestAnimationFrame(() => {
        // The mouseup may also trigger a click event. For handlers like selection,
        // isDragging can be checked before handling the click.
        setIsDragging(false);
      });
    },
    [onDrop]
  );

  const stopScrolling = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = null;
    isScrolling.current = false;
  }, []);

  const startScrolling = useCallback(
    (direction, scrollRate, scrollUnit = 30) => {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const maxScroll = direction === 'fwd' ? scrollHeight - clientHeight - scrollTop : scrollTop;
      const nextScroll = Math.min(maxScroll, scrollUnit);
      if (nextScroll > 0) {
        isScrolling.current = true;
        const dragPos = parseInt(draggable.current.element.style.top);
        if (direction === 'fwd') {
          draggable.current.element.style.top = dragPos + nextScroll + 'px';
          containerRef.current.scrollTop = scrollTop + nextScroll;
        } else {
          draggable.current.element.style.top = dragPos - nextScroll + 'px';
          containerRef.current.scrollTop = scrollTop - nextScroll;
        }
        scrollTimer.current = setTimeout(() => {
          startScrolling(direction, scrollRate, scrollUnit);
        }, 100);
      } else {
        stopScrolling();
      }
    },
    [containerRef, stopScrolling]
  );

  const dragMouseMoveHandler = useCallback(
    (evt) => {
      const { START, POS } = dimensions(orientation);
      const { [POS]: clientPos } = evt;
      const { current: lastClientPos } = previousPos;

      if (Math.abs(lastClientPos - clientPos) > 0) {
        previousPos.current = clientPos;

        let moveDistance = clientPos - startPos.current;
        const scrollDirection = getScrollDirection(clientPos);

        const pos = startPos.current - startOffset.current - mouseOffset.current + moveDistance;
        const renderPos = Math.max(dragLimits.current.start, Math.min(dragLimits.current.end, pos));
        if (draggable.current.element) {
          draggable.current.element.style[START] =
            renderPos + containerRef.current.scrollTop + 'px';

          if (scrollDirection && isScrollable.current && !isScrolling.current) {
            resetCurrentTarget(scrollDirection);
            startScrolling(scrollDirection, 1);
          } else if (!scrollDirection && isScrolling.current) {
            stopScrolling();
          }

          if (!isScrolling.current) {
            const direction = lastClientPos < clientPos ? 'fwd' : 'bwd';
            const offsetPos =
              clientPos -
              startOffset.current +
              containerRef.current.scrollTop -
              mouseOffset.current;
            const leadingEdge =
              direction === 'fwd' ? offsetPos + draggable.current.size : offsetPos;

            const getThreshold = direction === 'fwd' ? nextThreshold : prevThreshold;

            const overlappedElementIndex = getThreshold(
              dragThresholds.current,
              leadingEdge,
              draggable.current
            );
            if (
              overlappedElementIndex !== -1 &&
              direction === 'fwd' &&
              dragThresholds.current[overlappedElementIndex]?.element === target.current.element
            ) {
              displaceElementAtIndex(overlappedElementIndex + 1);
            } else if (
              direction === 'bwd' &&
              overlappedElementIndex !== -1 &&
              (dragThresholds.current[overlappedElementIndex]?.element !== target.current.element ||
                target.current.isLast)
            ) {
              if (overlappedElementIndex !== -1) {
                displaceElementAtIndex(overlappedElementIndex);
              }
            }
          }
        }
      }
    },
    [
      containerRef,
      displaceElementAtIndex,
      getScrollDirection,
      orientation,
      resetCurrentTarget,
      startScrolling,
      stopScrolling
    ]
  );

  const dragMouseUpHandler = useCallback(() => {
    removeEventListener('mousemove', dragMouseMoveHandler, false);
    removeEventListener('mouseup', dragMouseUpHandler, false);

    const {
      current: { element: dragElement, fromIndex }
    } = draggable;
    const {
      current: { element: displacedElement, isLast }
    } = target;

    if (dragElement) {
      dragElement.style.cssText = '';
      delete dragElement.dataset.dragging;
      const children = dragElement.parentNode.children;
      displacedElement.style.cssText = '';

      if (isLast) {
        handleDragEnd(fromIndex, -1);
      } else {
        const toIndex = Array.prototype.indexOf.call(children, displacedElement);
        handleDragEnd(fromIndex, toIndex);
      }
    }
  }, [dragMouseMoveHandler, handleDragEnd]);

  const preDragMouseMoveHandler = useCallback(
    (evt) => {
      const { CONTRA, DIMENSION, END, POS, START } = dimensions(orientation);
      const { [POS]: clientPos } = evt;
      let mouseMoveDistance = Math.abs(clientPos - startPos.current);
      if (mouseMoveDistance > dragThreshold) {
        removeEventListener('mousemove', preDragMouseMoveHandler, false);
        removeEventListener('mouseup', preDragMouseUpHandler, false);

        const dragElement = evt.target.closest(itemQuery);
        if (dragElement) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const draggableRect = dragElement.getBoundingClientRect();

          draggable.current = {
            element: dragElement,
            fromIndex: Array.prototype.indexOf.call(containerRef.current.children, dragElement),
            // pos: draggableRect[START],
            size: measureElementSize(dragElement, DIMENSION)
          };

          mouseOffset.current = clientPos - draggableRect[START];
          startOffset.current = containerRect[START];

          const lastChild = containerRef.current.querySelector(`${itemQuery}:last-child`);
          let lastChildEnd = containerRect[START];
          if (lastChild) {
            ({ [END]: lastChildEnd } = lastChild.getBoundingClientRect());
          }

          dragLimits.current.end = isScrollable.current
            ? containerRect[DIMENSION] - 30
            : lastChildEnd - containerRect[START];

          const containerOffset = (startOffset.current = containerRect[START]);
          const moveDistance = clientPos - startPos.current;
          const currentDragPos =
            draggableRect[START] - containerOffset + moveDistance + containerRef.current.scrollTop;

          dragElement.style.cssText = `position: absolute; width: 100%; ${START}: ${currentDragPos}px; ${CONTRA}: 0px;`;
          dragElement.dataset.dragging = true;

          handleDragStart();

          displaceElementAtIndex(draggable.current.fromIndex);

          addEventListener('mousemove', dragMouseMoveHandler, false);
          addEventListener('mouseup', dragMouseUpHandler, false);
        }
      }
    },
    [
      containerRef,
      displaceElementAtIndex,
      dragMouseMoveHandler,
      dragMouseUpHandler,
      handleDragStart,
      itemQuery,
      orientation,
      preDragMouseUpHandler
    ]
  );

  const preDragMouseUpHandler = useCallback(() => {
    removeEventListener('mousemove', preDragMouseMoveHandler, false);
    removeEventListener('mouseup', preDragMouseUpHandler, false);
  }, [preDragMouseMoveHandler]);

  const mouseDownHandler = useCallback(
    (evt) => {
      if (containerRef.current) {
        const { POS, SCROLL_SIZE, CLIENT_SIZE } = dimensions(orientation);

        const { [POS]: clientPos } = evt;
        startPos.current = clientPos;
        previousPos.current = clientPos;

        const { [SCROLL_SIZE]: scrollSize, [CLIENT_SIZE]: clientSize } = containerRef.current;
        isScrollable.current = scrollSize > clientSize;
        containerSize.current = clientSize;

        addEventListener('mousemove', preDragMouseMoveHandler, false);
        addEventListener('mouseup', preDragMouseUpHandler, false);
      }
    },
    [containerRef, orientation, preDragMouseMoveHandler, preDragMouseUpHandler]
  );

  return {
    isDragging,
    onMouseDown: allowDragDrop ? mouseDownHandler : undefined
  };
};
