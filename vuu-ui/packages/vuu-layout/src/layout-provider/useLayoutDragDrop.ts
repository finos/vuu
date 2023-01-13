import { MutableRefObject, ReactElement, useCallback, useRef } from "react";
import {
  DragDropRect,
  DragEndCallback,
  Draggable,
  DragInstructions
} from "../drag-drop";
import { DragStartAction } from "../layout-reducer";
import { getIntrinsicSize } from "../layout-reducer/flexUtils";
import { followPath } from "../utils";
import { LayoutProviderDispatch } from "./LayoutProviderContext";

const NO_INSTRUCTIONS = {} as DragInstructions;
const NO_OFFSETS: [number, number] = [0, 0];

interface CurrentDragAction extends Omit<DragStartAction, "evt" | "type"> {
  dragContainerPath: string;
}

interface DragOperation {
  payload: ReactElement;
  originalCSS: string;
  dragRect: unknown;
  dragInstructions: DragInstructions;
  dragOffsets: [number, number];
  targetPosition: { left: number; top: number };
}

const getDragElement = (
  rect: DragDropRect,
  id: string,
  dragElement?: HTMLElement
): [HTMLElement, string, number, number] => {
  const wrapper = document.createElement("div");
  wrapper.className = "vuuSimpleDraggableWrapper";
  wrapper.classList.add(
    "vuuSimpleDraggableWrapper",
    "salt-theme",
    "salt-density-medium"
  );
  wrapper.dataset.dragging = "true";

  const div = dragElement ?? document.createElement("div");
  div.id = id;

  wrapper.appendChild(div);
  document.body.appendChild(wrapper);
  const cssText = `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
  return [wrapper, cssText, rect.left, rect.top];
};

const determineDragOffsets = (
  draggedElement: HTMLElement
): [number, number] => {
  const { offsetParent } = draggedElement;
  if (offsetParent === null) {
    return NO_OFFSETS;
  } else {
    const { left: offsetLeft, top: offsetTop } =
      offsetParent.getBoundingClientRect();
    return [offsetLeft, offsetTop];
  }
};

export const useLayoutDragDrop = (
  rootLayoutRef: MutableRefObject<ReactElement>,
  dispatch: LayoutProviderDispatch
) => {
  const dragActionRef = useRef<CurrentDragAction>();
  const dragOperationRef = useRef<DragOperation>();
  const draggableHTMLElementRef = useRef<HTMLElement>();

  const handleDrag = useCallback((x, y) => {
    if (dragOperationRef.current && draggableHTMLElementRef.current) {
      const {
        dragOffsets: [offsetX, offsetY],
        targetPosition,
      } = dragOperationRef.current;
      const left = typeof x === "number" ? x - offsetX : targetPosition.left;
      const top = typeof y === "number" ? y - offsetY : targetPosition.top;
      if (left !== targetPosition.left || top !== targetPosition.top) {
        dragOperationRef.current.targetPosition.left = left;
        dragOperationRef.current.targetPosition.top = top;
        draggableHTMLElementRef.current.style.top = top + "px";
        draggableHTMLElementRef.current.style.left = left + "px";
      }
    }
  }, []);

  const handleDrop: DragEndCallback = useCallback((dropTarget) => {
    if (dragOperationRef.current) {
      const {
        dragInstructions,
        payload: draggedReactElement,
        originalCSS,
      } = dragOperationRef.current;
      dispatch({
        type: "drag-drop",
        draggedReactElement,
        dragInstructions,
        dropTarget,
      });

      console.log(`[useLayoutDragDrop]`, {
        dragInstructions,
      });
      if (draggableHTMLElementRef.current) {
        if (dragInstructions.RemoveDraggableOnDragEnd) {
          document.body.removeChild(draggableHTMLElementRef.current);
        } else {
          draggableHTMLElementRef.current.style.cssText = originalCSS;
          delete draggableHTMLElementRef.current.dataset.dragging;
        }
      }

      dragActionRef.current = undefined;
      dragOperationRef.current = undefined;
      draggableHTMLElementRef.current = undefined;
    }
  }, [dispatch]);

  const handleDragStart = useCallback(
    (evt: MouseEvent) => {
      if (dragActionRef.current) {
        const {
          payload: component,
          dragContainerPath,
          dragElement,
          dragRect,
          instructions = NO_INSTRUCTIONS,
          path,
        } = dragActionRef.current;
        const { current: rootLayout } = rootLayoutRef;
        const dragPos = { x: evt.clientX, y: evt.clientY };
        const dragPayload = component ?? followPath(rootLayout, path, true);
        const { id: dragPayloadId } = dragPayload.props;
        const intrinsicSize = getIntrinsicSize(dragPayload);
        let originalCSS = "",
          dragCSS = "",
          dragTransform = "";

        let dragStartLeft = -1;
        let dragStartTop = -1;
        let dragOffsets: [number, number] = NO_OFFSETS;

        let element = document.getElementById(dragPayloadId);

        if (element === null) {
          [element, dragCSS, dragStartLeft, dragStartTop] = getDragElement(
            dragRect,
            dragPayloadId,
            dragElement
          );
        } else {
          dragOffsets = determineDragOffsets(element);
          const [offsetLeft, offsetTop] = dragOffsets;
          const { width, height, left, top } = element.getBoundingClientRect();
          dragStartLeft = left - offsetLeft;
          dragStartTop = top - offsetTop;
          dragCSS = `width:${width}px;height:${height}px;left:${dragStartLeft}px;top:${dragStartTop}px;z-index: 100;background-color:#ccc;opacity: 0.6;`;
          element.dataset.dragging = "true";
          originalCSS = element.style.cssText;
        }

        dragTransform = Draggable.initDrag(
          rootLayoutRef.current,
          dragContainerPath,
          dragRect,
          dragPos,
          {
            drag: handleDrag,
            drop: handleDrop,
          },
          intrinsicSize
          // dropTargets
        );

        element.style.cssText = dragCSS + dragTransform;
        draggableHTMLElementRef.current = element;

        dragOperationRef.current = {
          payload: dragPayload,
          originalCSS,
          dragRect,
          dragOffsets,
          dragInstructions: instructions,
          targetPosition: { left: dragStartLeft, top: dragStartTop },
        };
      }
    },
    [handleDrag, handleDrop, rootLayoutRef]
  );

  const prepareToDrag = useCallback(
    (action: DragStartAction) => {
      const { evt, ...options } = action;
      console.log(`prepare to drag`, {
        options,
      });
      dragActionRef.current = {
        ...options,
        dragContainerPath: "",
      };
      Draggable.handleMousedown(evt, handleDragStart, options.instructions);
    },
    [handleDragStart]
  );

  return prepareToDrag;
};
