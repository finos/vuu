import {
  boxContainsPoint,
  getPositionWithinBox,
  type GridLayoutDropPosition,
  pointPositionWithinRect,
  queryClosest,
  type rect,
} from "@vuu-ui/vuu-utils";
import { type DragEventHandler, useCallback, useEffect, useRef } from "react";
import {
  useGridLayoutDragLeaveHandler,
  useGridLayoutDragPreviewHandler,
  useGridLayoutDropHandler,
  useGridLayoutId,
} from "./GridLayoutContext";
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
  layoutId: string,
): DropTarget | undefined => {
  let dropTargetEl = queryClosest(target, DROPTARGET_QUERY);
  if (dropTargetEl) {
    const owningLayout = queryClosest(dropTargetEl, ".vuuGridLayout", true);
    if (owningLayout.id !== layoutId) {
      return;
    }
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
  accepted: boolean;
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

const createDropTargetState = (): DropTargetState => ({
  accepted: false,
  mousePos: { clientX: -1, clientY: -1 },
  position: undefined,
  rect: { ...NullRect },
  dropTarget: undefined,
});

const createActiveDropTargetState = (
  dropTarget: DropTarget,
): DropTargetState => {
  const { bottom, left, right, top } =
    dropTarget.target.getBoundingClientRect();
  return {
    accepted: false,
    dropTarget,
    mousePos: { clientX: -1, clientY: -1 },
    position: undefined,
    rect: { bottom, left, right, top },
  };
};

export const useAsDropTarget = () => {
  const dropTargetStateRef = useRef<DropTargetState>(createDropTargetState());

  const drop = useGridLayoutDropHandler();
  const leave = useGridLayoutDragLeaveHandler();
  const preview = useGridLayoutDragPreviewHandler();
  const dragContext = useDragContext();
  const layoutId = useGridLayoutId();
  const clearDropTarget = useCallback(() => {
    const { dropTarget } = dropTargetStateRef.current;
    if (dropTarget) {
      removeDropTargetPositionClassName(dropTarget.target);
    }
    dropTargetStateRef.current = createDropTargetState();
  }, []);
  useEffect(() => {
    const unregister = dragContext.registerDragStateCleanup(clearDropTarget);
    return () => {
      unregister();
    };
  }, [clearDropTarget, dragContext]);
  const onDragEnter = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }
      const { dropTarget: currentDropTarget } = dropTargetStateRef.current;
      let dropTarget = getDropTarget(evt.target, currentDropTarget, layoutId);
      if (evt.defaultPrevented) {
        // We are entering Tabs, this is handled by drag-drop-listeners
        dropTarget = undefined;
      }

      if (dropTarget !== currentDropTarget) {
        if (dropTarget) {
          if (currentDropTarget) {
            removeDropTargetPositionClassName(currentDropTarget.target);
            leave();
          }
          // console.log(
          //   `%c[useAsDropTarget] onDragEnter set current dropTarget = ${dropTarget.gridLayoutItemId}`,
          //   "color:green;font-weight:bold;",
          // );

          dropTargetStateRef.current = createActiveDropTargetState(dropTarget);
        } else if (currentDropTarget) {
          dropTargetStateRef.current.dropTarget = undefined;
          dropTargetStateRef.current.accepted = false;
          dropTargetStateRef.current.position = undefined;
          removeDropTargetPositionClassName(currentDropTarget.target);
          leave();
          // console.log(
          //   `%c[useAsDropTarget] onDragEnter clear droptarget ${currentDropTarget?.gridLayoutItemId}`,
          //   "color:brown;font-weight: bold;",
          // );
        }
      }
    },
    [dragContext, layoutId, leave],
  );

  // We could replace this with mouse move to reduce event rate
  const onDragOver = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }
      let { dropTarget: currentDropTarget } = dropTargetStateRef.current;
      const dropTarget = getDropTarget(evt.target, currentDropTarget, layoutId);
      if (dropTarget) {
        if (dropTarget !== currentDropTarget) {
          if (currentDropTarget) {
            removeDropTargetPositionClassName(currentDropTarget.target);
            leave();
          }
          dropTargetStateRef.current = createActiveDropTargetState(dropTarget);
          currentDropTarget = dropTarget;
        }
        // TODO store dropTarget and rect and tabRect in same ref
        if (dropTarget === currentDropTarget) {
          const { position: lastPosition } = dropTargetStateRef.current;
          if (dropTarget.type === "header") {
            if (
              lastPosition !== "header" ||
              !dropTarget.target.classList.contains("vuuDropTarget-header")
            ) {
              const accepted = preview(
                dropTarget.gridLayoutItemId,
                dragContext.dragSource,
                "header",
              );
              dropTargetStateRef.current.accepted = accepted;
              dropTargetStateRef.current.position = "header";
              if (accepted) {
                addDropTargetPositionClassName(dropTarget.target, "header");
              }
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
              if (
                position !== lastPosition ||
                !dropTarget.target.classList.contains(
                  `${DROPTARGET_CLASSNAME}-${position}`,
                )
              ) {
                const accepted = preview(
                  dropTarget.gridLayoutItemId,
                  dragContext.dragSource,
                  position,
                );
                dropTargetStateRef.current.accepted = accepted;
                if (accepted && dropTargetStateRef.current.dropTarget) {
                  addDropTargetPositionClassName(dropTarget.target, position);
                } else {
                  removeDropTargetPositionClassName(dropTarget.target);
                }
                dropTargetStateRef.current.position = position;
              }
            }
          }
          if (dropTargetStateRef.current.accepted) {
            // A dragover must be cancelled for the browser to dispatch drop.
            evt.dataTransfer.dropEffect = "move";
            evt.preventDefault();
          }
        }
      }
    },
    [dragContext, layoutId, leave, preview],
  );

  const onDragLeave = useCallback<DragEventHandler>(
    (evt) => {
      if (dragContext.dragSource === undefined) {
        return;
      }
      const { dropTarget: currentDropTarget, rect: currentDropTargetRect } = dropTargetStateRef.current;

      if (currentDropTarget?.target && !boxContainsPoint(currentDropTargetRect, evt.clientX, evt.clientY)) {

        dropTargetStateRef.current.dropTarget = undefined;
        dropTargetStateRef.current.accepted = false;
        dropTargetStateRef.current.position = undefined;
        leave();

        removeDropTargetPositionClassName(currentDropTarget.target);
      }


    },
    [dragContext, leave],
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

        const dropTarget = getDropTarget(
          evt.target,
          currentDropTarget,
          layoutId,
        );
        if (
          dropTarget &&
          dropTargetStateRef.current.accepted &&
          dropTargetStateRef.current.position
        ) {
          // this prevents drag-drop-listeners drop firing when tab dragged to another tabstrip
          evt.preventDefault();
          removeDropTargetPositionClassName(dropTarget.target);
          const dropAccepted = drop(
            dropTarget.gridLayoutItemId,
            dragSource,
            dropTargetStateRef.current.position,
          );
          if (dropAccepted) {
            dragContext.completeDrop();
          }
        }
      }

      dropTargetStateRef.current.dropTarget = undefined;
      dropTargetStateRef.current.accepted = false;
      dropTargetStateRef.current.position = undefined;
    },
    [dragContext, drop, layoutId],
  );

  return {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};