import { MousePosition } from "@finos/vuu-ui-controls";
import {
  type GridLayoutDropPosition,
  pointPositionWithinRect,
  queryClosest,
  type rect,
  getPositionWithinBox,
} from "@finos/vuu-utils";
import { DragEventHandler, useCallback, useRef } from "react";
import { useGridLayoutDropHandler } from "./GridLayoutProvider";

const dropTargetClassName = "vuuDropTarget";
const dropTargetQuery = "[data-drop-target]";

const removedropTargetPositionClassName = (el: HTMLElement) => {
  el.classList.forEach((className) => {
    if (className.match(/(north|east|south|west|centre|tabs)$/)) {
      el.classList.remove(className);
    }
  });
};

/**
 * The dropTarget is usually the element with data-drop-target attribute. It can
 * store an IDREF to another element.
 */
const getDropTarget = (target: EventTarget) => {
  let dropTargetEl = queryClosest(target, dropTargetQuery);
  if (dropTargetEl) {
    const { dropTarget } = dropTargetEl.dataset;
    switch (dropTarget) {
      case "true":
        return dropTargetEl;
      case "header":
        return undefined;
      case undefined:
        throw Error(
          "[useAsDropTarget] getDropTarget, called on element without data-drop-target attribute",
        );
      default: {
        dropTargetEl = document.getElementById(dropTarget) as HTMLElement;
        if (dropTargetEl) {
          return dropTargetEl;
        } else {
          throw Error(
            `[useAsDropTarget] getDropTarget, data-drop-target ${dropTarget} not found`,
          );
        }
      }
    }
  } else {
    return null;
  }
};

type DropTargetState = {
  mousePos: MousePosition;
  position: GridLayoutDropPosition | undefined;
  rect: rect;
  tabRect: rect | undefined;
  targetEl: HTMLElement | undefined;
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
  tabRect: undefined,
  targetEl: undefined,
};

export const useAsDropTarget = () => {
  const dropTargetStateRef = useRef<DropTargetState>(NULL_STATE);

  const drop = useGridLayoutDropHandler();

  const onDragEnter = useCallback<DragEventHandler>((evt) => {
    const target = getDropTarget(evt.target);
    if (target !== dropTargetStateRef.current.targetEl) {
      if (target) {
        dropTargetStateRef.current.targetEl = target;
        const { rect } = dropTargetStateRef.current;
        const { bottom, left, right, top } = target.getBoundingClientRect();
        rect.bottom = bottom;
        rect.left = left;
        rect.right = right;
        rect.top = top;
        if (target.classList.contains("vuuGridLayoutStackedItem")) {
          const tabsList = target.querySelector('[role="tablist"]');
          if (tabsList) {
            const { bottom, left, right, top } =
              tabsList.getBoundingClientRect();
            dropTargetStateRef.current.tabRect = {
              bottom,
              left,
              right,
              top,
            };
          } else {
            throw Error(
              "[useAsDropTarget] onDragEnter, no tablist within GridLayoutStackedItem",
            );
          }
        } else {
          dropTargetStateRef.current.tabRect = undefined;
        }
      }
    }
  }, []);

  // We could replace this with mouse move to reduce event rate
  const onDragOver = useCallback<DragEventHandler>((evt) => {
    console.log("dragOver");

    const target = getDropTarget(evt.target);
    if (target) {
      evt.preventDefault();
      // TODO store dropTarget and rect and tabRect in same ref
      if (target === dropTargetStateRef.current.targetEl) {
        const { clientX, clientY } = evt;
        const { mousePos } = dropTargetStateRef.current;

        if (clientX !== mousePos.clientX || clientY !== mousePos.clientY) {
          mousePos.clientX = clientX;
          mousePos.clientY = clientY;

          const { rect, tabRect } = dropTargetStateRef.current;

          const { pctX, pctY /*, closeToTheEdge */ } = pointPositionWithinRect(
            clientX,
            clientY,
            rect,
          );
          const position = getPositionWithinBox(
            clientX,
            clientY,
            rect,
            pctX,
            pctY,
            tabRect,
          );
          const { position: lastPosition } = dropTargetStateRef.current;

          if (position !== lastPosition) {
            if (dropTargetStateRef.current.targetEl) {
              removedropTargetPositionClassName(target);
              dropTargetStateRef.current.targetEl.classList.add(
                `${dropTargetClassName}-${position}`,
              );
            }
            dropTargetStateRef.current.position = position;
          }
        }
      }
    }
  }, []);

  const onDragLeave = useCallback<DragEventHandler>((evt) => {
    const target = getDropTarget(evt.target);
    if (target === evt.target) {
      if (target === dropTargetStateRef.current.targetEl) {
        dropTargetStateRef.current.targetEl = undefined;
        dropTargetStateRef.current.position = undefined;
      }

      removedropTargetPositionClassName(target);
    }
  }, []);

  const onDrop = useCallback<DragEventHandler>(
    (evt) => {
      console.log(`[useAsDropTarget] drop`);
      let target = getDropTarget(evt.target);
      if (target && dropTargetStateRef.current.position) {
        removedropTargetPositionClassName(target);
        let { id } = target;
        if (!id) {
          target = queryClosest(evt.target, `.vuuGridLayoutItem`);
          if (!target) {
            throw Error("unable to identify drop target");
          }
          ({ id } = target);
        }

        const jsonData = evt.dataTransfer.getData("text/json");
        if (jsonData) {
          drop(id, JSON.parse(jsonData), dropTargetStateRef.current.position);
        } else {
          const dropId = evt.dataTransfer.getData("text/plain");
          if (dropId) {
            drop(id, dropId, dropTargetStateRef.current.position);
          } else {
            throw Error("onDrop no payload to drop");
          }
        }

        dropTargetStateRef.current.targetEl = undefined;
        dropTargetStateRef.current.position = undefined;
      }
    },
    [drop],
  );

  return {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};
