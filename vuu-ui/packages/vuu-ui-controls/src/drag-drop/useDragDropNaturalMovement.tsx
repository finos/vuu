import { useCallback, useMemo, useRef, useState } from "react";

import {
  Direction,
  DropOptions,
  InternalDragDropProps,
  InternalDragHookResult,
  ViewportRange,
} from "./dragDropTypes";
import { useDragDisplacers } from "./useDragDisplacers";
import { dispatchMouseEvent } from "@vuu-ui/vuu-utils";
import {
  dimensions,
  getIndexOfDraggedItem,
  getItemParentContainer,
  getNextDropTarget,
  MeasuredDropTarget,
  measureDropTargets,
  NOT_HIDDEN,
  NOT_OVERFLOWED,
} from "./drop-target-utils";

type DragPosition = {
  direction?: Direction;
  insertionPosition: number;
};

export const useDragDropNaturalMovement = ({
  containerRef,
  orientation = "horizontal",
  itemQuery = "*",
  selected,
  viewportRange,
}: InternalDragDropProps): InternalDragHookResult => {
  const dragPositionRef = useRef<DragPosition>({
    direction: undefined,
    insertionPosition: -1,
  });
  const isScrollable = useRef(false);
  /** current position of dragged element */
  const dragPosRef = useRef<number>(-1);
  const measuredDropTargets = useRef<MeasuredDropTarget[]>([]);
  const overflowMenuShowingRef = useRef(false);

  const [showOverflow, setShowOverflow] = useState(false);

  const { clearSpacers, displaceItem, displaceLastItem, setTerminalSpacer } =
    useDragDisplacers(orientation);

  const draggedItemRef = useRef<MeasuredDropTarget>(undefined);
  const fullItemQuery = `:is(${itemQuery}${NOT_OVERFLOWED}${NOT_HIDDEN},.vuuOverflowContainer-OverflowIndicator)`;

  const indexOf = (dropTarget: MeasuredDropTarget) =>
    measuredDropTargets.current.findIndex((d) => d.id === dropTarget.id);

  // Shouldn't need this - but viewportRange is always stale in stopScrolling. Checked all dependencies
  // look ok. Something to do with setTimeout / scrollHandler ?
  const rangeRef = useRef<ViewportRange>(undefined);
  rangeRef.current = viewportRange;

  const handleScrollStart = useCallback(
    (scrollDirection: "fwd" | "bwd") => {
      const itemContainer = getItemParentContainer(
        containerRef.current,
        itemQuery,
      );
      const { current: draggedItem } = draggedItemRef;

      // When we start scrolling, insert a spacer at the start of end of the collection.
      // This is what we will need if user scrolls right to end and it will give the correct
      // scrollHeight. Ig user stops scrolling before start/end we will reposition the
      // spacer(s) appropriately
      if (itemContainer && draggedItem) {
        setTerminalSpacer(
          itemContainer,
          scrollDirection === "fwd" ? "end" : "start",
          draggedItem.size,
        );
      }
    },
    [containerRef, itemQuery, setTerminalSpacer],
  );

  const handleScrollStop = useCallback(
    (scrollDirection: "fwd" | "bwd") => {
      const { current: container } = containerRef;
      const { current: draggedItem } = draggedItemRef;
      const { current: dragPosition } = dragPositionRef;
      if (container && draggedItem) {
        const dropTargets = (measuredDropTargets.current = measureDropTargets(
          container,
          orientation,
          fullItemQuery,
          rangeRef.current,
        ));

        const dropTargetAtBoundary =
          scrollDirection === "fwd" ? dropTargets.at(-1) : dropTargets.at(0);

        if (dropTargetAtBoundary) {
          const { mid, end, size, start } = dropTargetAtBoundary;
          if (scrollDirection === "fwd") {
            const draggedDropTarget = {
              ...draggedItem,
              start: Math.round(start + size),
              mid: Math.round(mid + size),
              end: Math.round(end + size),
            };
            dropTargets.push(draggedDropTarget);
            dragPosition.insertionPosition = dropTargetAtBoundary.index + 1;
          } else {
            const draggedDropTarget = {
              ...draggedItem,
              start: Math.round(start - size),
              mid: Math.round(mid - size),
              end: Math.round(end - size),
            };
            dropTargets.unshift(draggedDropTarget);
            dragPosition.insertionPosition = 0;
          }
        }
      }
    },
    [containerRef, fullItemQuery, orientation],
  );

  const beginDrag = useCallback(
    (dragElement: HTMLElement) => {
      if (
        //TODO need a different check for selected
        dragElement.ariaSelected &&
        Array.isArray(selected) &&
        selected.length > 1
      ) {
        console.log("its a selected element, and we have a multi select");
      }
      const { current: container } = containerRef;
      const { current: dragPosition } = dragPositionRef;

      if (container && dragElement) {
        const internalDrag = container.contains(dragElement);
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
          draggedItemId,
        ));

        if (internalDrag) {
          const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
          const draggedItem = dropTargets[indexOfDraggedItem];
          if (draggedItem && container) {
            draggedItemRef.current = draggedItem;
            const displaceFunction = draggedItem.isLast
              ? displaceLastItem
              : displaceItem;

            // This should return the insertion position of dragged item
            // which depends on both dro[Target and direction]
            dragPosition.insertionPosition = displaceFunction(
              dropTargets,
              draggedItem,
              draggedItem.size,
              false,
              "static",
            );
          }
        } else {
          // prettier-ignore
          const { top: dragPos, height: size } = dragElement.getBoundingClientRect();
          // prettier-ignore
          const dropTarget = getNextDropTarget( dropTargets, dragPos, size, "fwd");
          const index = dropTargets.indexOf(dropTarget);
          const { start, end, mid } = dropTarget;

          // need to compute the correct position of this
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const draggedItem = (draggedItemRef.current = {
            end,
            mid,
            start,
            isDraggedItem: true,
            isExternal: true,
            size,
          });

          const indexOfDropTarget = dropTargets.indexOf(dropTarget);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          dropTargets.splice(indexOfDropTarget, 0, draggedItem);
          for (let i = index + 1; i < dropTargets.length; i++) {
            const target = dropTargets[i];
            target.mid += size;
            target.end += size;
            target.start += size;
          }

          const displaceFunction = dropTarget.isLast
            ? displaceLastItem
            : displaceItem;

          displaceFunction(
            dropTargets,
            dropTarget,
            dropTarget.size,
            true,
            "static",
          );
        }
      }
    },
    [
      containerRef,
      displaceItem,
      displaceLastItem,
      fullItemQuery,
      orientation,
      selected,
      viewportRange,
    ],
  );

  const [showPopup, hidePopup] = useMemo(() => {
    let popupShowing = false;
    const show = (dropTarget: MeasuredDropTarget) => {
      if (!popupShowing) {
        popupShowing = true;
        const button = dropTarget.element.querySelector(
          ".vuuPopupMenu",
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
          ".vuuPopupMenu",
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
      const { current: dragPosition } = dragPositionRef;

      if (draggedItem) {
        if (containerRef.current) {
          dragPosRef.current = dragPos;

          const { current: dropTargets } = measuredDropTargets;
          const nextDropTarget = getNextDropTarget(
            dropTargets,
            dragPos,
            draggedItem.size,
            mouseMoveDirection,
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

              dragPosition.insertionPosition = displaceFunc(
                dropTargets,
                nextDropTarget,
                size,
                true,
                mouseMoveDirection,
              );

              const overflowIndicator = dropTargets.at(
                -1,
              ) as MeasuredDropTarget;
              hidePopup(overflowIndicator);
              setShowOverflow((overflowMenuShowingRef.current = false));
            }
          }
          dragPosition.direction = mouseMoveDirection;
        }
      }
    },
    [containerRef, displaceItem, displaceLastItem, hidePopup, showPopup],
  );

  const drop = useCallback((): DropOptions => {
    clearSpacers();
    const { current: dropTargets } = measuredDropTargets;
    const { current: dragPosition } = dragPositionRef;
    const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
    const draggedItem = dropTargets[indexOfDraggedItem];
    const { insertionPosition } = dragPosition;
    const { index: fromIndex, isExternal } = draggedItem;

    if (overflowMenuShowingRef.current) {
      setShowOverflow(false);
    }

    dragPosition.direction = undefined;
    dragPosition.insertionPosition = -1;

    const isLastItem = indexOfDraggedItem === dropTargets.length - 1;
    const toIndex = overflowMenuShowingRef.current
      ? -1
      : fromIndex < insertionPosition && !isLastItem
        ? insertionPosition - 1
        : insertionPosition;

    return { fromIndex, toIndex, isExternal };
  }, [clearSpacers]);

  const releaseDrag = useCallback(() => {
    clearSpacers(true);
  }, [clearSpacers]);

  return {
    beginDrag,
    drag,
    drop,
    handleScrollStart,
    handleScrollStop,
    releaseDrag,
    revealOverflowedItems: showOverflow,
  };
};
