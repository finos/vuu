import { MutableRefObject, ReactElement, useCallback, useRef } from "react";
import {
  DragDropRect,
  DragEndCallback,
  Draggable,
  DragInstructions,
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
  draggedReactElement: ReactElement;
  originalCSS: string;
  dragRect: any;
  dragInstructions: DragInstructions;
  dragOffsets: [number, number];
  targetPosition: { left: number; top: number };
}

// Create a temporary object for dragging, where we don not have an existing object
// e.g dragging a non-selected tab from a Stack or an item from Palette
const createElement = (
  rect: DragDropRect,
  id: string
): [HTMLElement, string, number, number] => {
  const div = document.createElement("div");
  div.id = id;
  div.className = "vuuSimpleDraggable";
  const cssText = `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
  div.dataset.dragging = "true";
  document.body.appendChild(div);
  return [div, cssText, rect.left, rect.top];
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
      const { dragInstructions, draggedReactElement, originalCSS } =
        dragOperationRef.current;
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
  }, []);

  /**
   * This will be called when Draggable has established that a drag operation is
   * underway. There may be a delay between the initial mousedown and the call to
   * this function - while we wait for either a drag timeout to fire or a minumum
   * mouse move threshold to be reached.
   */
  const handleDragStart = useCallback((evt: MouseEvent) => {
    if (dragActionRef.current) {
      const {
        component,
        dragContainerPath,
        dragRect,
        // dropTargets,
        instructions = NO_INSTRUCTIONS,
        path,
        // preDragActivity,
        // resolveDragStart // see View drag
      } = dragActionRef.current;
      const { current: rootLayout } = rootLayoutRef;
      const dragPos = { x: evt.clientX, y: evt.clientY };
      const draggedReactElement =
        component ?? followPath(rootLayout, path, true);
      const { id } = draggedReactElement.props;
      const intrinsicSize = getIntrinsicSize(draggedReactElement);
      let originalCSS = "",
        dragCSS = "",
        dragTransform = "";
      let dragInstructions = instructions;

      let dragStartLeft = -1;
      let dragStartTop = -1;
      let dragOffsets: [number, number] = NO_OFFSETS;

      // TODO this has a bearing on offsets we apply to (absolutely positioned) dragged element.
      // If we are creating the element here, offset parent will be document body.
      let element = document.getElementById(id);

      if (element === null) {
        // This may bew the case where, for example, we drag a Tab (non selected) from a Tabstrip.
        [element, dragCSS, dragStartLeft, dragStartTop] = createElement(
          dragRect,
          id
        );
        dragInstructions = {
          ...dragInstructions,
          RemoveDraggableOnDragEnd: true,
        };
      } else {
        dragOffsets = determineDragOffsets(element);
        const [offsetLeft, offsetTop] = dragOffsets;
        const { width, height, left, top } = element.getBoundingClientRect();
        dragStartLeft = left - offsetLeft;
        dragStartTop = top - offsetTop;
        dragCSS = `width:${width}px;height:${height}px;left:${dragStartLeft}px;top:${dragStartTop}px;z-index: 100;background-color:#ccc;opacity: 0.6;`;
        // Important that this is set before we call initDrag
        // this just enables position: absolute
        element.dataset.dragging = "true";

        // resolveDragStart && resolveDragStart(true);

        // if (preDragActivity) {
        //   await preDragActivity();
        // }

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
        draggedReactElement,
        originalCSS,
        dragRect,
        dragOffsets,
        dragInstructions: instructions,
        targetPosition: { left: dragStartLeft, top: dragStartTop },
      };
    }
  }, []);

  const prepareToDrag = useCallback(
    (action: DragStartAction) => {
      const { evt, ...options } = action;
      console.log(`prepare to drag`, {
        options,
      });
      dragActionRef.current = {
        ...options,
        dragContainerPath: "",
        // dragContainerPath: '0.0.1.1'
      };
      Draggable.handleMousedown(evt, handleDragStart, options.instructions);
    },
    [handleDragStart]
  );

  return prepareToDrag;
};
