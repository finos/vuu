import { useCallback, useMemo, useRef, useState } from "react";

import {
  Direction,
  InternalDragDropProps,
  InternalDragHookResult,
  ViewportRange,
} from "./dragDropTypesNext";
import { useDragDisplacers } from "./useDragDisplacers";
import { dispatchMouseEvent } from "@finos/vuu-utils";
import {
  dimensions,
  getIndexOfDraggedItem,
  getNextDropTarget,
  MeasuredDropTarget,
  measureDropTargets,
  NOT_HIDDEN,
  NOT_OVERFLOWED,
} from "./drop-target-utils";

export const useDragDropNaturalMovement = ({
  draggableRef,
  onDrop,
  orientation = "horizontal",
  containerRef,
  itemQuery = "*",
  selected,
  viewportRange,
}: InternalDragDropProps): InternalDragHookResult => {
  const dragDirectionRef = useRef<Direction | undefined>();

  const isScrollable = useRef(false);
  /** current position of dragged element */
  const dragPosRef = useRef<number>(-1);
  const measuredDropTargets = useRef<MeasuredDropTarget[]>([]);
  const overflowMenuShowingRef = useRef(false);

  const [showOverflow, setShowOverflow] = useState(false);

  const { clearSpacers, displaceItem, displaceLastItem } = useDragDisplacers();

  const draggedItemRef = useRef<MeasuredDropTarget>();
  const fullItemQuery = `:is(${itemQuery}${NOT_OVERFLOWED}${NOT_HIDDEN},.vuuOverflowContainer-OverflowIndicator)`;

  // const { setMeasurements: setVizData } = useListViz();

  const indexOf = (dropTarget: MeasuredDropTarget) =>
    measuredDropTargets.current.findIndex((d) => d.id === dropTarget.id);

  // Shouldn't need this - but viewportRange is always stale in stopScrolling. Checked all dependencies
  // look ok. Something to do with setTimeout / scrollHandler ?
  const rangeRef = useRef<ViewportRange>();
  rangeRef.current = viewportRange;

  const handleScrollStart = useCallback(() => {
    clearSpacers();
  }, [clearSpacers]);

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
        if (scrollDirection === "fwd") {
          measuredDropTargets.current.push(draggedItem);
        } else {
          measuredDropTargets.current.unshift(draggedItem);
        }

        // setVizData?.(measuredDropTargets.current);

        const { size } = draggedItem;
        const dragPos = dragPosRef.current;
        const midPos = dragPos + size / 2;
        const { current: dropTargets } = measuredDropTargets;
        const dropTarget = getNextDropTarget(dropTargets, midPos, "fwd");

        if (dropTarget) {
          const targetIndex = indexOf(dropTarget);
          const nextInsertPos = targetIndex;
          const nextDropTarget = dropTargets[nextInsertPos];

          if (atEnd && scrollDirection === "fwd") {
            displaceLastItem(
              dropTargets,
              dropTargets[dropTargets.length - 1],
              size,
              false,
              "static",
              orientation
            );
          } else {
            displaceItem(
              dropTargets,
              nextDropTarget,
              size,
              true,
              "static",
              orientation
            );
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
        //TODO need a different check for selected
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
          viewportRange,
          draggedItemId
        ));

        console.log({ dropTargets });

        const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
        const draggedItem = dropTargets[indexOfDraggedItem];

        if (draggedItem && container) {
          draggedItemRef.current = draggedItem;

          const displaceFunction = draggedItem.isLast
            ? displaceLastItem
            : displaceItem;

          // setVizData?.(dropTargets, displacedItem, dropZone);

          console.log({ indexOfDraggedItem, draggedItem });

          displaceFunction(
            dropTargets,
            draggedItem,
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

  const [showPopup, hidePopup] = useMemo(() => {
    let popupShowing = false;
    const show = (dropTarget: MeasuredDropTarget) => {
      if (!popupShowing) {
        popupShowing = true;
        const button = dropTarget.element.querySelector(
          ".vuuPopupMenu"
        ) as HTMLElement;
        if (button) {
          dispatchMouseEvent(button, "click");
        }
      }
    };

    const hide = (dropTarget: MeasuredDropTarget) => {
      if (popupShowing) {
        popupShowing = false;
        const button = dropTarget.element.querySelector(
          ".vuuPopupMenu"
        ) as HTMLElement;
        if (button) {
          dispatchMouseEvent(button, "click");
        }
      }
    };

    return [show, hide];
  }, []);

  const drag = useCallback(
    (dragPos: number, mouseMoveDirection: "fwd" | "bwd") => {
      const { current: draggedItem } = draggedItemRef;

      if (draggedItem) {
        if (draggableRef.current && containerRef.current) {
          dragPosRef.current = dragPos;

          const { current: dropTargets } = measuredDropTargets;
          const nextDropTarget = getNextDropTarget(
            dropTargets,
            dragPos,
            mouseMoveDirection
          );

          if (nextDropTarget && !nextDropTarget.isDraggedItem) {
            if (nextDropTarget.isOverflowIndicator) {
              // Does this belong in here or can we abstract it out
              setShowOverflow((overflowMenuShowingRef.current = true));
              showPopup(nextDropTarget);
            } else {
              const { size } = draggedItem;
              const targetIndex = indexOf(nextDropTarget);

              const displaceFunc =
                targetIndex === dropTargets.length - 1
                  ? displaceLastItem
                  : displaceItem;

              displaceFunc(
                dropTargets,
                nextDropTarget,
                size,
                true,
                mouseMoveDirection,
                orientation
              );

              // setVizData?.(dropTargets, nextDropTarget, nextDropZone);

              const overflowIndicator = dropTargets.at(
                -1
              ) as MeasuredDropTarget;
              hidePopup(overflowIndicator);
              setShowOverflow((overflowMenuShowingRef.current = false));
            }
          }

          dragDirectionRef.current = mouseMoveDirection;
        }
      }
    },
    [
      containerRef,
      displaceItem,
      displaceLastItem,
      draggableRef,
      hidePopup,
      orientation,
      showPopup,
    ]
  );

  const drop = useCallback(() => {
    clearSpacers();
    const { current: dropTargets } = measuredDropTargets;
    const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
    const draggedItem = dropTargets[indexOfDraggedItem];
    if (draggedItem) {
      dragDirectionRef.current = undefined;

      if (overflowMenuShowingRef.current) {
        onDrop(draggedItem.index, -1);
      } else {
        const absoluteIndexDraggedItem = getIndexOfDraggedItem(
          dropTargets,
          true
        );
        onDrop(draggedItem.index, absoluteIndexDraggedItem);
      }
    }
    setShowOverflow(false);

    if (containerRef.current) {
      // TODO we're not catching every scenario where we need to control
      // the final scroll position here.
      const scrollTop = containerRef.current?.scrollTop;
      if (indexOfDraggedItem < dropTargets.length) {
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
