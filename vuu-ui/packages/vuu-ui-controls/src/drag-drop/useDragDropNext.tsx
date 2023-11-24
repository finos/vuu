import { isOverflowElement } from "@finos/vuu-layout";
import { dispatchCustomEvent } from "@finos/vuu-utils";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useDragDropProvider } from "./DragDropProvider";
import { DragDropState } from "./DragDropState";
import {
  DragDropHook,
  DropHandler,
  InternalDragDropProps,
  InternalDragHookResult,
  MouseOffset,
} from "./dragDropTypesNext";
import { Draggable } from "./Draggable";
import {
  cloneElement,
  constrainRect,
  dimensions,
  getScrollableContainer,
  isContainerScrollable,
  NOT_OVERFLOWED,
} from "./drop-target-utils";
import { ScrollStopHandler, useAutoScroll } from "./useAutoScroll";
import { useDragDropCopy } from "./useDragDropCopy";
import { useDragDropIndicator } from "./useDragDropIndicator";
import { useDragDropNaturalMovement } from "./useDragDropNaturalMovementNext";
import { ResumeDragHandler } from "./useGlobalDragDrop";

const NULL_DRAG_DROP_RESULT = {
  beginDrag: () => undefined,
  drag: () => undefined,
  draggableRef: { current: null },
  drop: () => undefined,
  isDragging: false,
  isScrolling: false,
  handleScrollStart: () => undefined,
  handleScrollStop: () => undefined,
  revealOverflowedItems: false,
};

type DraggableStatus = {
  draggable?: JSX.Element;
  draggedItemIndex: number;
  isDragging: boolean;
};

type DragBoundary = {
  start: number;
  end: number;
  contraStart: number;
  contraEnd: number;
};

const UNBOUNDED: DragBoundary = {
  start: 0,
  end: 1000,
  contraStart: 0,
  contraEnd: 1000,
};

type InternalHook = (props: InternalDragDropProps) => InternalDragHookResult;
const noDragDrop: InternalHook = () => NULL_DRAG_DROP_RESULT;
const dragThreshold = 3;

const getDraggableElement = (
  el: EventTarget | null,
  query: string
): HTMLElement => (el as HTMLElement).closest(query) as HTMLElement;

const getLastElement = (
  container: HTMLElement,
  itemQuery: string
): [HTMLElement, boolean] => {
  const fullItemQuery = `:is(${itemQuery}${NOT_OVERFLOWED},.vuuOverflowContainer-OverflowIndicator)`;
  const childElements = Array.from(container.querySelectorAll(fullItemQuery));
  const lastElement = childElements.pop() as HTMLElement;
  return [lastElement, isOverflowElement(lastElement)];
};

export const useDragDropNext: DragDropHook = ({
  allowDragDrop,
  containerRef,
  draggableClassName,
  getDragPayload,
  id,
  itemQuery = "*",
  onDragStart,
  onDrop,
  onDropSettle,
  orientation,
  ...dragDropProps
}) => {
  const dragBoundaries = useRef<DragBoundary>({
    start: 0,
    end: 0,
    contraStart: 0,
    contraEnd: 0,
  });
  const [draggableStatus, setDraggableStatus] = useState<DraggableStatus>({
    draggable: undefined,
    draggedItemIndex: -1,
    isDragging: false,
  });

  const dragDropStateRef = useRef<DragDropState | null>(null);
  const mouseDownTimer = useRef<number | null>(null);
  /** do we actually have scrollable content  */
  const isScrollableRef = useRef(false);
  /** current mouse position */
  const mousePosRef = useRef<MouseOffset>({ x: 0, y: 0 });
  /** mouse position when mousedown initiated drag */
  const startPosRef = useRef<MouseOffset>({ x: 0, y: 0 });
  /** references the dragged Item during its final 'settling' phase post drop  */
  const settlingItemRef = useRef<HTMLElement | null>(null);
  /** the container which will scroll if content overflows  */
  const scrollableContainerRef = useRef<HTMLElement | null>(null);
  const dropPosRef = useRef(-1);
  const dropIndexRef = useRef(-1);

  const handleScrollStopRef = useRef<ScrollStopHandler>();

  const {
    isDragSource,
    isDropTarget,
    onDragOut,
    onEndOfDragOperation,
    register,
  } = useDragDropProvider(id);

  type NativeMouseHandler = (evt: MouseEvent) => void;
  /** refs for drag handlers to avoid circular dependency issues  */
  const dragMouseMoveHandlerRef = useRef<NativeMouseHandler>();
  const dragMouseUpHandlerRef = useRef<NativeMouseHandler>();

  const attachDragHandlers = useCallback(() => {
    const { current: dragMove } = dragMouseMoveHandlerRef;
    const { current: dragUp } = dragMouseUpHandlerRef;
    if (dragMove && dragUp) {
      // prettier-ignore
      document.addEventListener("mousemove", dragMove, false);
      document.addEventListener("mouseup", dragUp, false);
    }
  }, []);
  const removeDragHandlers = useCallback(() => {
    const { current: dragMove } = dragMouseMoveHandlerRef;
    const { current: dragUp } = dragMouseUpHandlerRef;
    if (dragMove && dragUp) {
      // prettier-ignore
      document.removeEventListener("mousemove", dragMove, false);
      document.removeEventListener("mouseup", dragUp, false);
    }
  }, []);

  /**
   * Establish the boundaries for the current drag operation. When dragging along
   * a single axis (eg list items within a list, tabs within a tabstrip), constrain
   * valid drag positions to the confines of the container. A sharp drag away from
   * the primary drag axis is interpreted as a request to drag an item out of the
   * container. This will be allowed if configured appropriately.
   */
  const setDragBoundaries = useCallback(
    (containerRect: DOMRect, draggableRect: DOMRect) => {
      const { current: container } = containerRef;
      if (container) {
        const [lastElement, lastItemIsOverflowIndicator] = getLastElement(
          container,
          itemQuery
        );
        const { CONTRA, CONTRA_END, DIMENSION, END, START } =
          dimensions(orientation);

        const draggableSize = draggableRect[DIMENSION];
        const { [START]: lastItemStart, [END]: lastItemEnd } =
          lastElement.getBoundingClientRect();

        dragBoundaries.current.start = containerRect[START];
        dragBoundaries.current.end = lastItemIsOverflowIndicator
          ? Math.max(lastItemStart, containerRect.right - draggableSize)
          : isScrollableRef.current
          ? containerRect[START] + containerRect[DIMENSION] - draggableSize
          : lastItemEnd - draggableSize;
        dragBoundaries.current.contraStart = containerRect[CONTRA];
        dragBoundaries.current.contraEnd = containerRect[CONTRA_END];
      }
    },
    [containerRef, itemQuery, orientation]
  );

  const terminateDrag = useCallback(() => {
    const { current: settlingItem } = settlingItemRef;
    settlingItemRef.current = null;

    const { current: toIndex } = dropIndexRef;
    const droppedItem = containerRef.current?.querySelector(
      `${itemQuery}[data-index="${toIndex}"]`
    );
    if (droppedItem) {
      droppedItem.classList.remove("vuuDropTarget-settling");
    }
    dropIndexRef.current = -1;
    onDropSettle?.(toIndex);
    setDraggableStatus((status) => ({
      ...status,
      draggable: undefined,
    }));

    if (settlingItem) {
      dispatchCustomEvent(settlingItem, "vuu-dropped");
    }
  }, [containerRef, itemQuery, onDropSettle]);

  const getScrollDirection = useCallback(
    (mousePos: number) => {
      if (scrollableContainerRef.current && dragDropStateRef.current) {
        const { mouseOffset } = dragDropStateRef.current;

        const { POS, SCROLL_POS, SCROLL_SIZE, CLIENT_SIZE } =
          dimensions(orientation);
        const {
          [SCROLL_POS]: scrollPos,
          [SCROLL_SIZE]: scrollSize,
          [CLIENT_SIZE]: clientSize,
        } = scrollableContainerRef.current;

        const maxScroll = scrollSize - clientSize;
        const canScrollFwd = scrollPos < maxScroll;
        const viewportEnd = dragBoundaries.current.end;
        const bwd =
          scrollPos > 0 &&
          mousePos - mouseOffset[POS] <= dragBoundaries.current.start;
        const fwd = canScrollFwd && mousePos - mouseOffset[POS] >= viewportEnd;
        return bwd ? "bwd" : fwd ? "fwd" : "";
      }
    },
    [scrollableContainerRef, orientation]
  );

  const useDragDropHook: InternalHook =
    allowDragDrop === true || allowDragDrop === "natural-movement"
      ? useDragDropNaturalMovement
      : allowDragDrop === "drop-indicator"
      ? useDragDropIndicator
      : allowDragDrop === "drag-copy"
      ? useDragDropCopy
      : noDragDrop;

  const onScrollingStopped = useCallback(
    (scrollDirection: "fwd" | "bwd", scrollPos: number, atEnd: boolean) => {
      handleScrollStopRef.current?.(scrollDirection, scrollPos, atEnd);
    },
    []
  );

  const { isScrolling, startScrolling, stopScrolling } = useAutoScroll({
    containerRef: scrollableContainerRef,
    onScrollingStopped,
    orientation,
  });

  const handleDrop = useCallback<DropHandler>(
    (fromIndex, toIndex, options) => {
      //TODO why do we need both this and dropIndexRef ?
      dropPosRef.current = toIndex;
      if (options.isExternal) {
        onDrop?.(fromIndex, toIndex, {
          ...options,
          payload: dragDropStateRef.current?.payload,
        });
      } else {
        onDrop?.(fromIndex, toIndex, options);
      }
      dropIndexRef.current = toIndex;
      if (id) {
        onEndOfDragOperation?.(id);
      }
      dragDropStateRef.current = null;
    },
    [id, onDrop, onEndOfDragOperation]
  );

  const {
    beginDrag,
    drag,
    drop,
    handleScrollStart,
    handleScrollStop,
    releaseDrag,
    ...dragResult
  } = useDragDropHook({
    ...dragDropProps,
    containerRef,
    // draggableRef,
    isDragSource,
    isDropTarget,
    itemQuery,
    onDrop: handleDrop,
    orientation,
  });
  // To avoid circular ref between hooks
  handleScrollStopRef.current = handleScrollStop;

  const dragHandedOvertoProvider = useCallback(
    (dragDistance: number, clientContraPos: number) => {
      const { CONTRA_POS } = dimensions(orientation);
      const lastClientContraPos = mousePosRef.current[CONTRA_POS];

      const dragOutDistance = isDragSource
        ? Math.abs(lastClientContraPos - clientContraPos)
        : 0;

      // If isDropTarget is false, there are configured dropTargets in context
      // but this is not one, so drag will be handed straight over to DragProvider
      // (global drag). If isDropTarget is undefined, we have no DragProvider
      // so we are dealing with a simple local drag drop operation.
      const handoverToProvider =
        isDropTarget === false || dragOutDistance - dragDistance > 5;

      if (dragDropStateRef.current && handoverToProvider) {
        if (onDragOut?.(id as string, dragDropStateRef.current)) {
          // TODO create a cleanup function
          removeDragHandlers();
          releaseDrag?.();
          dragDropStateRef.current = null;
        }
        // remove the drag boundaries
        dragBoundaries.current = UNBOUNDED;
        return true;
      }
    },
    [
      id,
      isDragSource,
      isDropTarget,
      onDragOut,
      orientation,
      releaseDrag,
      removeDragHandlers,
    ]
  );

  const dragMouseMoveHandler = useCallback(
    (evt: MouseEvent) => {
      const { CLIENT_POS, CONTRA_CLIENT_POS, POS } = dimensions(orientation);
      const { clientX, clientY } = evt;
      const { [CLIENT_POS]: clientPos, [CONTRA_CLIENT_POS]: clientContraPos } =
        evt;
      const lastClientPos = mousePosRef.current[POS];
      const dragDistance = Math.abs(lastClientPos - clientPos);
      const { current: dragDropState } = dragDropStateRef;

      if (dragHandedOvertoProvider(dragDistance, clientContraPos)) {
        return;
      }

      mousePosRef.current.x = clientX;
      mousePosRef.current.y = clientY;

      if (dragDropState) {
        const { draggableElement, mouseOffset } = dragDropState;

        if (dragBoundaries.current === UNBOUNDED && draggableElement) {
          const dragPosX = mousePosRef.current.x - mouseOffset.x;
          const dragPosY = mousePosRef.current.y - mouseOffset.y;
          draggableElement.style.top = `${dragPosY}px`;
          draggableElement.style.left = `${dragPosX}px`;
        } else if (dragDistance > 0 && draggableElement) {
          const mouseMoveDirection = lastClientPos < clientPos ? "fwd" : "bwd";
          const scrollDirection = getScrollDirection(clientPos);
          const dragPos = mousePosRef.current[POS] - mouseOffset[POS];

          if (
            scrollDirection &&
            isScrollableRef.current &&
            !isScrolling.current
          ) {
            handleScrollStart?.();
            startScrolling(scrollDirection, 1);
          } else if (!scrollDirection && isScrolling.current) {
            stopScrolling();
          }

          if (!isScrolling.current) {
            const renderDragPos = Math.round(
              Math.max(
                dragBoundaries.current.start,
                Math.min(dragBoundaries.current.end, dragPos)
              )
            );
            const START = orientation === "horizontal" ? "left" : "top";
            draggableElement.style[START] = `${renderDragPos}px`;
            drag(renderDragPos, mouseMoveDirection);
          }
        }
      }
    },
    [
      drag,
      dragHandedOvertoProvider,
      getScrollDirection,
      handleScrollStart,
      isScrolling,
      orientation,
      startScrolling,
      stopScrolling,
    ]
  );
  const dragMouseUpHandler = useCallback(() => {
    removeDragHandlers();
    if (dragDropStateRef.current) {
      settlingItemRef.current = dragDropStateRef.current.draggableElement;
    }
    // The implementation hook is currently invoking the onDrop callback, we should move it into here
    drop();
    setDraggableStatus((status) => ({
      ...status,
      draggedItemIndex: -1,
      isDragging: false,
    }));
    // TODO clear the dragDropState
  }, [drop, removeDragHandlers]);

  dragMouseMoveHandlerRef.current = dragMouseMoveHandler;
  dragMouseUpHandlerRef.current = dragMouseUpHandler;

  const resumeDrag = useCallback<ResumeDragHandler>(
    (dragDropState: DragDropState) => {
      dragDropStateRef.current = dragDropState;
      // Note this is using the draggable element rather than the original draggedElement
      const { draggableElement, mouseOffset } = dragDropState;
      const { current: container } = containerRef;

      if (container && draggableElement) {
        const containerRect = container.getBoundingClientRect();
        const draggableRect = draggableElement.getBoundingClientRect();
        setDragBoundaries(containerRect, draggableRect);

        mousePosRef.current.x = draggableRect.left + mouseOffset.x;
        mousePosRef.current.y = draggableRect.top + mouseOffset.y;

        // why doesn't this work if we use the initialDragEement
        beginDrag(draggableElement);

        attachDragHandlers();

        return true;
      } else {
        return false;
      }
    },
    [attachDragHandlers, beginDrag, containerRef, setDragBoundaries]
  );

  const dragStart = useCallback(
    (evt: MouseEvent) => {
      const { target } = evt;
      const dragElement = getDraggableElement(target, itemQuery);
      const { current: container } = containerRef;
      if (container && dragElement) {
        const scrollableContainer = getScrollableContainer(
          container,
          itemQuery
        );

        isScrollableRef.current = isContainerScrollable(
          scrollableContainer,
          orientation
        );
        scrollableContainerRef.current = scrollableContainer;

        const containerRect = container.getBoundingClientRect();
        const draggableRect = dragElement.getBoundingClientRect();

        const dragDropState = (dragDropStateRef.current = new DragDropState(
          evt,
          dragElement
        ));

        setDragBoundaries(containerRect, draggableRect);

        beginDrag(dragElement);

        const {
          dataset: { index = "-1" },
        } = dragElement;

        setDraggableStatus({
          isDragging: true,
          draggable: (
            <Draggable
              element={cloneElement(dragElement)}
              onDropped={terminateDrag}
              onTransitionEnd={terminateDrag}
              ref={dragDropState.setDraggable}
              style={constrainRect(draggableRect, containerRect)}
              wrapperClassName={draggableClassName}
            />
          ),
          draggedItemIndex: parseInt(index),
        });

        onDragStart?.(dragDropState);
        attachDragHandlers();
      }
    },
    [
      attachDragHandlers,
      beginDrag,
      containerRef,
      draggableClassName,
      itemQuery,
      onDragStart,
      orientation,
      setDragBoundaries,
      terminateDrag,
    ]
  );

  const preDragMouseMoveHandler = useCallback(
    (evt: MouseEvent) => {
      const { CLIENT_POS, POS } = dimensions(orientation);
      const { [CLIENT_POS]: clientPos } = evt;
      const mouseMoveDistance = Math.abs(clientPos - startPosRef.current[POS]);
      if (mouseMoveDistance > dragThreshold && containerRef.current) {
        if (mouseDownTimer.current) {
          window.clearTimeout(mouseDownTimer.current);
          mouseDownTimer.current = null;
        }
        document.removeEventListener("mousemove", preDragMouseMoveHandler);
        document.removeEventListener("mouseup", preDragMouseUpHandler, false);

        dragStart(evt);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containerRef, beginDrag, orientation]
  );

  const preDragMouseUpHandler = useCallback(() => {
    if (mouseDownTimer.current) {
      window.clearTimeout(mouseDownTimer.current);
      mouseDownTimer.current = null;
    }
    document.removeEventListener("mousemove", preDragMouseMoveHandler, false);
    document.removeEventListener("mouseup", preDragMouseUpHandler, false);
  }, [preDragMouseMoveHandler]);

  const mouseDownHandler: MouseEventHandler = useCallback(
    (evt) => {
      // TODO runtime check here for valid drop targets ?

      const { current: container } = containerRef;
      // We don't want to prevent other handlers on this element from working
      // but we do want to stop a drag drop being initiated on a bubbled event.
      evt.stopPropagation();
      if (container && !evt.defaultPrevented) {
        const { clientX, clientY } = evt;
        mousePosRef.current.x = startPosRef.current.x = clientX;
        mousePosRef.current.y = startPosRef.current.y = clientY;

        document.addEventListener("mousemove", preDragMouseMoveHandler, false);
        document.addEventListener("mouseup", preDragMouseUpHandler, false);

        evt.persist();

        mouseDownTimer.current = window.setTimeout(() => {
          document.removeEventListener(
            "mousemove",
            preDragMouseMoveHandler,
            false
          );
          document.removeEventListener("mouseup", preDragMouseUpHandler, false);
          dragStart(evt.nativeEvent);
        }, 500);
      }
    },
    [containerRef, dragStart, preDragMouseMoveHandler, preDragMouseUpHandler]
  );

  const { current: settlingItem } = settlingItemRef;
  useLayoutEffect(() => {
    if (settlingItem && containerRef.current) {
      const dropPos = dropPosRef.current;
      const droppedItem = containerRef.current.querySelector(
        `${itemQuery}[data-index="${dropPos}"]`
      );
      if (droppedItem) {
        droppedItem.classList.add("vuuDropTarget-settling");
        requestAnimationFrame(() => {
          const { top: targetTop, left: targetLeft } =
            droppedItem.getBoundingClientRect();
          const { top: currentTop, left: currentLeft } =
            settlingItem.getBoundingClientRect();
          // If the droppedItem is already exactly in the drop position, we can just
          // terminate the drag here and now. Most likely, though, it is out by a few
          // pixels. We animate the dragged item into the final resting place before
          // terminating the drag.
          if (currentLeft !== targetLeft || currentTop !== targetTop) {
            settlingItem.classList.add("vuuDraggable-settling");
            settlingItem.style.top = `${targetTop}px`;
            settlingItem.style.left = `${targetLeft}px`;
          } else {
            terminateDrag();
          }
        });
      }
      // settlingItemRef.current = null;
    }
  }, [containerRef, itemQuery, settlingItem, terminateDrag]);

  useEffect(() => {
    if (id && (isDragSource || isDropTarget)) {
      register(id, allowDragDrop === "drop-only" ? false : resumeDrag, onDrop);
    }
  }, [
    allowDragDrop,
    id,
    isDragSource,
    isDropTarget,
    onDrop,
    register,
    resumeDrag,
  ]);

  return {
    ...dragResult,
    ...draggableStatus,
    isScrolling,
    onMouseDown:
      allowDragDrop && allowDragDrop !== "drop-only"
        ? mouseDownHandler
        : undefined,
  };
};
