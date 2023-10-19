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
  dropTargetsDebugString,
  getIndexOfDraggedItem,
  getNextDropTarget,
  MeasuredDropTarget,
  measureDropTargets,
  NOT_HIDDEN,
  NOT_OVERFLOWED,
} from "./drop-target-utils";

export const useDragDropNaturalMovement = ({
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

  const { clearSpacers, displaceItem, displaceLastItem } =
    useDragDisplacers(orientation);

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

        const { size } = draggedItem;
        const dragPos = dragPosRef.current;
        const midPos = dragPos + size / 2;
        const { current: dropTargets } = measuredDropTargets;
        const dropTarget = getNextDropTarget(dropTargets, midPos, size, "fwd");

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
              "static"
            );
          } else {
            displaceItem(dropTargets, nextDropTarget, size, true, "static");
          }
        }
      }
    },
    [containerRef, displaceItem, displaceLastItem, fullItemQuery, orientation]
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
          draggedItemId
        ));

        if (internalDrag) {
          console.log(dropTargetsDebugString(dropTargets));
          const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
          const draggedItem = dropTargets[indexOfDraggedItem];
          if (draggedItem && container) {
            draggedItemRef.current = draggedItem;
            const displaceFunction = draggedItem.isLast
              ? displaceLastItem
              : displaceItem;
            displaceFunction(
              dropTargets,
              draggedItem,
              draggedItem.size,
              false,
              "static"
            );
          }
        } else {
          // prettier-ignore
          const { top: dragPos, height: size } = dragElement.getBoundingClientRect();
          // prettier-ignore
          const dropTarget = getNextDropTarget( dropTargets, dragPos, size, "fwd");
          const index = dropTargets.indexOf(dropTarget);
          const { start, end, mid } = dropTarget;

          console.log(`nextDropTarget ${dropTarget.element.textContent}`);

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

          console.log(dropTargetsDebugString(dropTargets));

          const displaceFunction = dropTarget.isLast
            ? displaceLastItem
            : displaceItem;

          displaceFunction(
            dropTargets,
            dropTarget,
            dropTarget.size,
            true,
            "static"
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
        if (containerRef.current) {
          dragPosRef.current = dragPos;

          const { current: dropTargets } = measuredDropTargets;
          const nextDropTarget = getNextDropTarget(
            dropTargets,
            dragPos,
            draggedItem.size,
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
                mouseMoveDirection
              );

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
    [containerRef, displaceItem, displaceLastItem, hidePopup, showPopup]
  );

  const drop = useCallback(() => {
    clearSpacers();
    const { current: dropTargets } = measuredDropTargets;
    const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
    const draggedItem = dropTargets[indexOfDraggedItem];
    if (draggedItem) {
      dragDirectionRef.current = undefined;

      if (overflowMenuShowingRef.current) {
        onDrop(draggedItem.index, -1, {
          fromIndex: draggedItem.index,
          toIndex: -1,
          isExternal: draggedItem.isExternal,
        });
      } else {
        const absoluteIndexDraggedItem = getIndexOfDraggedItem(
          dropTargets,
          true
        );
        onDrop(draggedItem.index, absoluteIndexDraggedItem, {
          fromIndex: draggedItem.index,
          toIndex: absoluteIndexDraggedItem,
          isExternal: draggedItem.isExternal,
        });
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
