import {
  getPositionWithinBox,
  type GridLayoutDropPosition,
  pointPositionWithinRect,
  queryClosest,
  type rect,
} from "@finos/vuu-utils";
import { DragEventHandler, useCallback, useRef } from "react";
import { useGridLayoutDropHandler, useGridLayoutId } from "./GridLayoutContext";
import { useDragContext } from "./drag-drop-next/DragDropProviderNext";

const DROPTARGET_CLASSNAME = "vuuDropTarget";
const GRIDITEM_QUERY = ".vuuGridLayoutItem";
const DROPTARGET_QUERY = "[data-drop-target]";

const removeDropTargetPositionClassName = (el: HTMLElement) => {
  el.classList.forEach((className) => {
    if (className.match(/(north|east|south|west|centre|tabs|header)$/)) {
      el.classList.remove(className);
    }
  });
};

const addDropTargetPositionClassName = (
  el: HTMLElement,
  position: GridLayoutDropPosition,
) => {
  removeDropTargetPositionClassName(el);
  el.classList.add(`${DROPTARGET_CLASSNAME}-${position}`);
};

interface MousePosition {
  clientX: number;
  clientY: number;
}

/**
 * Describes a drop target. Will always reference a GrtidLayoutItem, but these may include more than
 * one dropTarget e.g. the header and the content area will each be drop targets and help determine
 * the drop position.
 */
type DropTarget = {
  /**
   * identifies the GridLayoutItem associated with the dropTarget
   */
  gridLayoutItemId: string;
  /**
   * The element with data-drop-target attribute
   */
  target: HTMLElement;
  /**
   * Drop behaviour will differ depending on whether we are dragging over the header or main content body.
   * A remote target is located elsewhere in the dom from the current drag location, e.g the tabPanel
   * associated with a Tab.
   */
  type: "header" | "content" | "remote";
};

/**
 * The dropTarget is usually the element with data-drop-target attribute. It can
 * store an IDREF to another element.
 */
const getDropTarget = (
  target: EventTarget,
  currentDropTarget: DropTarget | undefined,
): DropTarget | undefined => {
  let dropTargetEl = queryClosest(target, DROPTARGET_QUERY);
  if (dropTargetEl) {
    const { id: gridLayoutItemId } = queryClosest(
      dropTargetEl,
      GRIDITEM_QUERY,
      true,
    );

    if (dropTargetEl === currentDropTarget?.target) {
      return currentDropTarget;
    } else {
      const { dropTarget: dropTargetValue } = dropTargetEl.dataset;
      switch (dropTargetValue) {
        case "true":
          return {
            gridLayoutItemId,
            target: dropTargetEl,
            type: "content",
          };
        case "header":
          return {
            gridLayoutItemId,
            target: dropTargetEl,
            type: "header",
          };
        case undefined:
          throw Error(
            "[useAsDropTarget] getDropTarget, called on element without data-drop-target attribute",
          );
        default: {
          dropTargetEl = document.getElementById(
            dropTargetValue,
          ) as HTMLElement;
          if (dropTargetEl) {
            return {
              gridLayoutItemId,
              target: dropTargetEl,
              type: "remote",
            };
          } else {
            throw Error(
              `[useAsDropTarget] getDropTarget, data-drop-target ${dropTargetValue} not found`,
            );
          }
        }
      }
    }
  }
};

type DropTargetState = {
  mousePos: MousePosition;
  position: GridLayoutDropPosition | undefined;
  rect: rect;
  dropTarget: DropTarget | undefined;
};

const NullRect: rect = {
  bottom: -1,
  left: -1,
  right: -1,
  top: -1,
};

const NULL_STATE: DropTargetState = {
  mousePos: { clientX: -1, clientY: -1 },
  position: undefined,
  rect: NullRect,
  dropTarget: undefined,
};

export const useAsDropTarget = () => {
  const dropTargetStateRef = useRef<DropTargetState>(NULL_STATE);

  const drop = useGridLayoutDropHandler();
  const dragContext = useDragContext();
  const layoutId = useGridLayoutId();

  const onDragEnter = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }
      const { dropTarget: currentDropTarget } = dropTargetStateRef.current;
      let dropTarget = getDropTarget(evt.target, currentDropTarget);
      console.log(
        `[useAsDropTarget#${layoutId}] onDragEnter ${dropTarget?.gridLayoutItemId}, evt already handled ${evt.defaultPrevented}`,
      );

      if (evt.defaultPrevented) {
        // We are entering Tabs, this is handled by drag-drop-listeners
        dropTarget = undefined;
      }

      if (dropTarget !== currentDropTarget) {
        if (dropTarget) {
          // console.log(
          //   `%c[useAsDropTarget] onDragEnter set current dropTarget = ${dropTarget.gridLayoutItemId}`,
          //   "color:green;font-weight:bold;",
          // );

          dropTargetStateRef.current.dropTarget = dropTarget;
          const { rect } = dropTargetStateRef.current;
          const { bottom, left, right, top } =
            dropTarget.target.getBoundingClientRect();
          rect.bottom = bottom;
          rect.left = left;
          rect.right = right;
          rect.top = top;
        } else if (currentDropTarget) {
          dropTargetStateRef.current.dropTarget = undefined;
          // console.log(
          //   `%c[useAsDropTarget] clear droptarget ${currentDropTarget?.gridLayoutItemId}`,
          //   "color:brown;font-weight: bold;",
          // );
          removeDropTargetPositionClassName(currentDropTarget?.target);
        }
      }
    },
    [dragContext, layoutId],
  );

  // We could replace this with mouse move to reduce event rate
  const onDragOver = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }
      const { dropTarget: currentDropTarget } = dropTargetStateRef.current;
      const dropTarget = getDropTarget(evt.target, currentDropTarget);
      if (dropTarget) {
        // preventDefault on the event to enable drop
        evt.preventDefault();
        // TODO store dropTarget and rect and tabRect in same ref
        if (dropTarget === currentDropTarget) {
          const { position: lastPosition } = dropTargetStateRef.current;
          if (dropTarget.type === "header") {
            if (lastPosition !== "header") {
              addDropTargetPositionClassName(dropTarget.target, "header");
              dropTargetStateRef.current.position = "header";
            }
          } else {
            const { clientX, clientY } = evt;
            const { mousePos } = dropTargetStateRef.current;

            if (clientX !== mousePos.clientX || clientY !== mousePos.clientY) {
              mousePos.clientX = clientX;
              mousePos.clientY = clientY;

              const { rect } = dropTargetStateRef.current;

              const { pctX, pctY /*, closeToTheEdge */ } =
                pointPositionWithinRect(clientX, clientY, rect);
              const position = getPositionWithinBox(
                clientX,
                clientY,
                rect,
                pctX,
                pctY,
              );
              // console.log(
              //   `[useAsDropTarget] onDragOver ${dropTarget.gridLayoutItemId} position ${position}`,
              // );
              if (position !== lastPosition) {
                if (dropTargetStateRef.current.dropTarget) {
                  addDropTargetPositionClassName(dropTarget.target, position);
                }
                dropTargetStateRef.current.position = position;
              }
            }
          }
        }
      }
    },
    [dragContext],
  );

  const onDragLeave = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }
      const { dropTarget: currentDropTarget } = dropTargetStateRef.current;
      const dropTarget = getDropTarget(evt.target, currentDropTarget);
      // console.log(
      //   `[useAsDropTarget] onDragleave ${evt.target?.className} to ${evt.relatedTarget?.className}`,
      //   {
      //     dropTarget,
      //   },
      // );
      if (dropTarget?.target === evt.target) {
        if (dropTarget === currentDropTarget) {
          console.log(
            `[useAsDropTarget] onDragleave ... leaving the current dropTarget, dropTarget is now undefined`,
          );
          dropTargetStateRef.current.dropTarget = undefined;
          dropTargetStateRef.current.position = undefined;
        }

        removeDropTargetPositionClassName(dropTarget.target);
      }
    },
    [dragContext],
  );

  const onDrop = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }

      const { dropTarget: currentDropTarget } = dropTargetStateRef.current;
      const { dragSource } = dragContext;
      // We ignore drop events when no dragSOurce has been registered. These will be
      // GridSPlitter events and will be handled directly by the GridSplitter
      if (dragSource && currentDropTarget) {
        // console.log(`[useAsDropTarget#${layoutId}] onDrop`, { dragSource });

        const dropTarget = getDropTarget(evt.target, currentDropTarget);
        if (dropTarget && dropTargetStateRef.current.position) {
          // this prevents drag-drop-listeners drop firing when tab dragged to another tabstrip
          evt.preventDefault();
          removeDropTargetPositionClassName(dropTarget.target);
          drop(
            dropTarget.gridLayoutItemId,
            dragSource,
            dropTargetStateRef.current.position,
          );
        }
      }

      dropTargetStateRef.current.dropTarget = undefined;
      dropTargetStateRef.current.position = undefined;
    },
    [dragContext, drop],
  );

  return {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};
