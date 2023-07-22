import { useCallback, useRef, useState } from "react";

import {
  InternalDragDropProps,
  InternalDragHookResult,
  Direction,
} from "./dragDropTypes";
import { useDropIndicator } from "./useDropIndicator";

// import { useListViz } from "../../../../../../showcase/src/examples/uitk/ListVisualizer";

import {
  dimensions,
  getItemById,
  MeasuredDropTarget,
  measureDropTargets,
  getNextDropTarget,
  dropZone,
  removeDraggedItem,
} from "./dragUtils";

import { createDropIndicator, Draggable } from "./Draggable";
import { ViewportRange } from "../../list/useScrollPosition";

const NOT_OVERFLOWED = ':not([data-overflowed="true"])';
const NOT_HIDDEN = ':not([aria-hidden="true"])';

export const useDragDropIndicator = ({
  draggableRef,
  onDrop,
  orientation = "horizontal",
  containerRef,
  itemQuery = "*",
  selected,
  viewportRange,
}: InternalDragDropProps): InternalDragHookResult => {
  const dragDirectionRef = useRef<Direction | undefined>();
  const dropIndicatorRef = useRef<HTMLDivElement>(null);
  const dropTargetRef = useRef<MeasuredDropTarget | null>(null);
  const dropZoneRef = useRef<dropZone | "">("");
  const isScrollable = useRef(false);
  /** current position of dragged element */
  const dragPosRef = useRef<number>(-1);
  const measuredDropTargets = useRef<MeasuredDropTarget[]>([]);
  const overflowMenuShowingRef = useRef(false);

  const [showOverflow, setShowOverflow] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<JSX.Element | undefined>();

  const { clearSpacer, positionDropIndicator } = useDropIndicator();

  const draggedItemRef = useRef<MeasuredDropTarget>();
  const fullItemQuery = `:is(${itemQuery}${NOT_OVERFLOWED}${NOT_HIDDEN},[data-overflow-indicator])`;

  // const { setMeasurements: setVizData } = useListViz();

  const indexOf = (dropTarget: MeasuredDropTarget) =>
    measuredDropTargets.current.findIndex((d) => d.id === dropTarget.id);

  const reposition = (
    dropTarget: MeasuredDropTarget,
    distance: number,
    indexShift?: number
  ) => {
    dropTarget.start += distance;
    dropTarget.mid += distance;
    dropTarget.end += distance;
    if (typeof indexShift === "number") {
      dropTarget.currentIndex += indexShift;
    }
  };

  // Shouldn't need this - but viewportRange is always stale in stopScrolling. Checked all dependencies
  // look ok. Something to do with setTimeout / scrollHandler ?
  const rangeRef = useRef<ViewportRange>();
  rangeRef.current = viewportRange;

  const handleScrollStart = useCallback(() => {
    clearSpacer();
  }, [clearSpacer]);

  const handleScrollStop = useCallback(
    (scrollDirection: "fwd" | "bwd", _scrollPos: number, atEnd: boolean) => {
      const { current: container } = containerRef;
      const { current: draggedItem } = draggedItemRef;
      if (container && draggedItem) {
        measuredDropTargets.current = measureDropTargets(
          container,
          orientation,
          fullItemQuery,
          rangeRef.current
        );
        // setVizData(measuredDropTargets.current);

        const { size } = draggedItem;
        const dragPos = dragPosRef.current;
        const midPos = dragPos + size / 2;
        const { current: dropTargets } = measuredDropTargets;
        const [nextDropTarget, nextDropZone] = getNextDropTarget(
          dropTargets,
          draggedItem,
          midPos
        );
        if (nextDropTarget) {
          if (atEnd && scrollDirection === "fwd") {
            positionDropIndicator(
              dropTargets[dropTargets.length - 1],
              nextDropZone
            );
          } else {
            positionDropIndicator(nextDropTarget, nextDropZone);
          }
        }

        // setVizData(measuredDropTargets.current, nextDropTarget);
      }
    },
    [
      containerRef,
      positionDropIndicator,
      fullItemQuery,
      orientation,
      // setVizData,
    ]
  );

  const beginDrag = useCallback(
    (evt: MouseEvent) => {
      const evtTarget = evt.target as HTMLElement;
      const dragElement = evtTarget.closest(itemQuery) as HTMLElement;
      if (
        dragElement.ariaSelected &&
        Array.isArray(selected) &&
        selected.length > 1
      ) {
        console.log("its a selected element, and we have a multi select");
      }
      const { current: container } = containerRef;
      if (container && dragElement) {
        const { SCROLL_SIZE, CLIENT_SIZE } = dimensions(orientation);
        const { id: draggedItemId } = dragElement;

        const { [SCROLL_SIZE]: scrollSize, [CLIENT_SIZE]: clientSize } =
          container;
        isScrollable.current = scrollSize > clientSize;

        const dropTargets = (measuredDropTargets.current = measureDropTargets(
          container,
          orientation,
          fullItemQuery,
          viewportRange
        ));

        const draggedItem = getItemById(dropTargets, draggedItemId);

        if (draggedItem && container) {
          const targetIndex = indexOf(draggedItem);
          removeDraggedItem(dropTargets, targetIndex);
          draggedItemRef.current = draggedItem;

          // This begins to deviate from NaturalMovement here -----------
          const { current: range } = rangeRef;
          //TODO when our viewport is the last 'page' of a scrolling viewport
          // the viewport will scoll up by one row when we remove an item, so
          // the position of each item will move down.
          if (range?.atEnd) {
            for (let i = 0; i < dropTargets.length; i++) {
              reposition(dropTargets[i], draggedItem.size);
            }
          }
          for (let i = targetIndex; i < dropTargets.length; i++) {
            reposition(dropTargets[i], -draggedItem.size, -1);
          }

          const [dropTarget, dropZone] = draggedItem.isLast
            ? [dropTargets[dropTargets.length - 1], "end"]
            : [dropTargets[targetIndex], "start"];

          dropTargetRef.current = dropTarget;
          dropZoneRef.current = dropZone as dropZone;

          // setVizData(dropTargets, dropTarget, dropZone);

          const dropIndicatorPosition = positionDropIndicator(
            dropTarget,
            dropZone as dropZone
          );

          const { top, left, width } =
            dropIndicatorPosition.getBoundingClientRect();
          // Next render will remove the dragged item, that will offset our initial
          // dropIndicatorPosition
          const dropIndicatorRect = {
            top: draggedItem.isLast
              ? range?.atEnd && !range.atStart
                ? top + draggedItem.size - 2
                : top - 2
              : top - draggedItem.size - 2,
            left,
            width,
            height: 2,
          };

          setDropIndicator(
            <Draggable
              wrapperClassName="dropIndicatorContainer"
              rect={dropIndicatorRect}
              ref={dropIndicatorRef}
              element={createDropIndicator()}
            />
          );
        }
      }
    },
    [
      itemQuery,
      selected,
      containerRef,
      orientation,
      fullItemQuery,
      viewportRange,
      // setVizData,
      positionDropIndicator,
    ]
  );

  const drag = useCallback(
    (dragPos: number, mouseMoveDirection: "fwd" | "bwd") => {
      const { current: currentDropTarget } = dropTargetRef;
      const { current: currentDropZone } = dropZoneRef;
      const { current: draggedItem } = draggedItemRef;

      if (draggedItem) {
        if (draggableRef.current && containerRef.current) {
          const START = orientation === "horizontal" ? "left" : "top";
          dragPosRef.current = dragPos;

          const { current: dropTargets } = measuredDropTargets;
          const [nextDropTarget, nextDropZone] = getNextDropTarget(
            dropTargets,
            draggedItem,
            dragPos
          );

          if (
            nextDropTarget &&
            (nextDropTarget.index !== currentDropTarget?.index ||
              nextDropZone !== currentDropZone)
            // mouseMoveDirection !== dragDirectionRef.current
          ) {
            if (nextDropTarget.isOverflowIndicator) {
              // Does this belong in here or can we abstract it out
              setShowOverflow((overflowMenuShowingRef.current = true));
            } else if (dropIndicatorRef.current) {
              const targetIndex = indexOf(nextDropTarget);
              if (targetIndex === dropTargets.length - 1) {
                // because we maintain at least one out-of-viewport row in
                // the dropTargets, this means we are at the very last item.
                const dropTarget = dropTargets[dropTargets.length - 1];
                const dropIndicatorPosition = positionDropIndicator(
                  dropTarget,
                  nextDropZone
                );
                const dropIndicatorRect =
                  dropIndicatorPosition.getBoundingClientRect();
                dropIndicatorRef.current.style[
                  START
                ] = `${dropIndicatorRect.top}px`;
              } else {
                const dropIndicatorPosition = positionDropIndicator(
                  nextDropTarget,
                  nextDropZone
                ) as unknown as HTMLElement;
                const dropIndicatorRect =
                  dropIndicatorPosition.getBoundingClientRect();
                dropIndicatorRef.current.style[
                  START
                ] = `${dropIndicatorRect.top}px`;
              }
              // setVizData(dropTargets, nextDropTarget, nextDropZone);

              setShowOverflow((overflowMenuShowingRef.current = false));
            }

            dropTargetRef.current = nextDropTarget;
            dropZoneRef.current = nextDropZone;
            dragDirectionRef.current = mouseMoveDirection;
          }
        }
      }
    },
    [draggableRef, containerRef, orientation, positionDropIndicator]
  );

  const drop = useCallback(() => {
    clearSpacer();
    const { current: draggedItem } = draggedItemRef;
    const { current: dropTarget } = dropTargetRef;
    const { current: dropZone } = dropZoneRef;
    const { current: range } = rangeRef;

    if (draggedItem && range && dropTarget) {
      const { index: fromIndex } = draggedItem;

      const dropBefore = dropZone === "start";
      const {
        index: originalDropTargetIndex,
        currentIndex: currentDropTargetIndex,
      } = dropTarget;

      dropTargetRef.current = null;
      dragDirectionRef.current = undefined;

      //TODO why is this different from Natural Movement ?
      if (overflowMenuShowingRef.current) {
        onDrop(fromIndex, -1);
      } else {
        if (fromIndex < originalDropTargetIndex) {
          onDrop(
            fromIndex,
            dropBefore ? currentDropTargetIndex : currentDropTargetIndex + 1
          );
        } else {
          onDrop(
            fromIndex,
            dropBefore ? originalDropTargetIndex : originalDropTargetIndex + 1
          );
        }
      }
      setDropIndicator(undefined);
    }
    setShowOverflow(false);
  }, [clearSpacer, onDrop]);

  return {
    beginDrag,
    drag,
    drop,
    dropIndicator,
    handleScrollStart,
    handleScrollStop,
    revealOverflowedItems: showOverflow,
  };
};
