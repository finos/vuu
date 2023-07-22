import { useCallback, useRef, useState } from "react";

import {
  Direction,
  InternalDragDropProps,
  InternalDragHookResult,
} from "./dragDropTypes";
import { useDragDisplacers } from "./useDragDisplacers";

// import { useListViz } from "../../../../../../showcase/src/examples/salt/ListVisualizer";

import {
  dimensions,
  dropZone,
  getItemById,
  getNextDropTarget,
  MeasuredDropTarget,
  measureDropTargets,
  removeDraggedItem,
} from "./dragUtils";

import { ViewportRange } from "../../list/useScrollPosition";

const NOT_OVERFLOWED = ':not([data-overflowed="true"])';
const NOT_HIDDEN = ':not([aria-hidden="true"])';
export const useDragDropNaturalMovement = ({
  draggableRef,
  id,
  onDrop,
  orientation = "horizontal",
  containerRef,
  itemQuery = "*",
  selected,
  viewportRange,
}: InternalDragDropProps): InternalDragHookResult => {
  const dragDirectionRef = useRef<Direction | undefined>();
  const dropTargetRef = useRef<MeasuredDropTarget | null>(null);
  const dropZoneRef = useRef<dropZone | "">("");
  const insertPosRef = useRef<number>(-1);

  const isScrollable = useRef(false);
  /** current position of dragged element */
  const dragPosRef = useRef<number>(-1);
  const measuredDropTargets = useRef<MeasuredDropTarget[]>([]);
  const overflowMenuShowingRef = useRef(false);

  const [showOverflow, setShowOverflow] = useState(false);

  const { clearDisplacedItem, clearSpacers, displaceItem, displaceLastItem } =
    useDragDisplacers();

  const draggedItemRef = useRef<MeasuredDropTarget>();
  const fullItemQuery = `:is(${itemQuery}${NOT_OVERFLOWED}${NOT_HIDDEN},[data-overflow-indicator])`;

  // const { setMeasurements: setVizData } = useListViz();

  const indexOf = (dropTarget: MeasuredDropTarget) =>
    measuredDropTargets.current.findIndex((d) => d.id === dropTarget.id);

  const reposition = (dropTarget: MeasuredDropTarget, distance: number) => {
    dropTarget.start += distance;
    dropTarget.mid += distance;
    dropTarget.end += distance;
  };

  // Shouldn't need this - but viewportRange is always stale in stopScrolling. Checked all dependencies
  // look ok. Something to do with setTimeout / scrollHandler ?
  const rangeRef = useRef<ViewportRange>();
  rangeRef.current = viewportRange;

  const handleScrollStart = useCallback(() => {
    clearDisplacedItem();
  }, [clearDisplacedItem]);

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

        // setVizData?.(measuredDropTargets.current);

        const { size } = draggedItem;
        const dragPos = dragPosRef.current;
        const midPos = dragPos + size / 2;
        const { current: dropTargets } = measuredDropTargets;
        const [dropTarget, dropZone] = getNextDropTarget(
          dropTargets,
          draggedItem,
          midPos
        );

        if (dropTarget) {
          const targetIndex = indexOf(dropTarget);
          // const nextInsertPos =
          //   dropZone === "end" ? targetIndex + 1 : targetIndex;
          const nextInsertPos = targetIndex;
          const nextDropTarget = dropTargets[nextInsertPos];

          dropTargetRef.current = nextDropTarget;
          dropZoneRef.current = scrollDirection === "fwd" ? "start" : dropZone;
          insertPosRef.current = nextInsertPos;

          if (atEnd && scrollDirection === "fwd") {
            displaceLastItem(
              dropTargets[dropTargets.length - 1],
              size,
              false,
              "static",
              orientation
            );
            insertPosRef.current = dropTargets.length - 1;
          } else {
            displaceItem(nextDropTarget, size, true, "static", orientation);
            for (let i = targetIndex; i < dropTargets.length; i++) {
              reposition(dropTargets[i], size);
            }
            insertPosRef.current = dropTargets.length - 1;
          }
          // setVizData?.(
          //   measuredDropTargets.current,
          //   nextDropTarget,
          //   dropZoneRef.current
          // );
        }
      }
    },
    [
      containerRef,
      displaceItem,
      displaceLastItem,
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

          const insertPos = draggedItem.isLast
            ? dropTargets.length - 1
            : targetIndex;

          const [displacedItem, dropZone, displaceFunction] = draggedItem.isLast
            ? [dropTargets[insertPos], "end", displaceLastItem]
            : [dropTargets[insertPos], "start", displaceItem];

          dropTargetRef.current = displacedItem;
          dropZoneRef.current = dropZone as dropZone;
          insertPosRef.current = insertPos;

          // setVizData?.(dropTargets, displacedItem, dropZone);

          displaceFunction(
            displacedItem,
            draggedItem.size,
            false,
            "static",
            orientation
          );
        }
      }
    },
    [
      containerRef,
      displaceItem,
      displaceLastItem,
      fullItemQuery,
      itemQuery,
      orientation,
      selected,
      // setVizData,
      viewportRange,
    ]
  );

  const drag = useCallback(
    (dragPos: number, mouseMoveDirection: "fwd" | "bwd") => {
      const { current: currentDropTarget } = dropTargetRef;
      const { current: currentDropZone } = dropZoneRef;
      const { current: currentInsertPos } = insertPosRef;
      const { current: draggedItem } = draggedItemRef;

      if (draggedItem) {
        if (draggableRef.current && containerRef.current) {
          // const START = orientation === "horizontal" ? "left" : "top";
          // draggableRef.current.style[START] = `${dragPos}px`;
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
          ) {
            if (nextDropTarget.isOverflowIndicator) {
              // Does this belong in here or can we abstract it out
              setShowOverflow((overflowMenuShowingRef.current = true));
            } else {
              const { size } = draggedItem;
              const targetIndex = indexOf(nextDropTarget);
              const nextInsertPos =
                nextDropZone === "end" ? targetIndex + 1 : targetIndex;

              if (nextInsertPos !== currentInsertPos) {
                if (targetIndex === dropTargets.length - 1) {
                  // because we maintain at least one out-of-viewport row in
                  // the dropTargets, this means we are at the very last item.
                  const dropTarget = dropTargets[dropTargets.length - 1];
                  displaceLastItem(
                    dropTarget,
                    size,
                    true,
                    mouseMoveDirection,
                    orientation
                  );
                  reposition(
                    dropTarget,
                    mouseMoveDirection === "fwd" ? -size : size
                  );
                } else {
                  displaceItem(
                    nextDropTarget,
                    size,
                    true,
                    mouseMoveDirection,
                    orientation
                  );
                  // setVizData?.(dropTargets, nextDropTarget, nextDropZone);
                  const restoredSize =
                    mouseMoveDirection === "fwd" ? -size : size;
                  reposition(nextDropTarget, restoredSize);
                }
                // setVizData?.(dropTargets, nextDropTarget, nextDropZone);

                setShowOverflow((overflowMenuShowingRef.current = false));
                insertPosRef.current = nextInsertPos;
              }
            }

            dropTargetRef.current = nextDropTarget;
            dropZoneRef.current = nextDropZone;
            dragDirectionRef.current = mouseMoveDirection;
          }
        }
      }
    },
    [
      containerRef,
      displaceItem,
      displaceLastItem,
      draggableRef,
      orientation,
      // setVizData,
    ]
  );

  const drop = useCallback(() => {
    clearSpacers();
    const { current: draggedItem } = draggedItemRef;
    const { current: dropTarget } = dropTargetRef;
    if (draggedItem && dropTarget) {
      const { index: fromIndex } = draggedItem;
      const { currentIndex: toIndex } = dropTarget;
      dropTargetRef.current = null;
      dragDirectionRef.current = undefined;
      if (overflowMenuShowingRef.current) {
        onDrop(fromIndex, -1);
      } else {
        onDrop(fromIndex, toIndex);
      }
    }
    setShowOverflow(false);

    if (containerRef.current) {
      // TODO we're not catching every scenario where we need to control
      // the final scroll position here.
      const scrollTop = containerRef.current?.scrollTop;
      if (!dropTarget?.isLast) {
        containerRef.current.scrollTop = scrollTop;
      }
    }
  }, [clearSpacers, containerRef, onDrop]);

  return {
    beginDrag,
    drag,
    drop,
    handleScrollStart,
    handleScrollStop,
    revealOverflowedItems: showOverflow,
  };
};
