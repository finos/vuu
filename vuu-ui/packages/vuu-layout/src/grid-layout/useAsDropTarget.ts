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

const positions = [
  `vuuDropTarget-north`,
  `vuuDropTarget-south`,
  `vuuDropTarget-east`,
  `vuuDropTarget-west`,
];

export const useAsDropTarget = () => {
  const placeholderRef = useRef<HTMLElement>();
  const positionRef = useRef<GridLayoutDropPosition>();
  const mousePosRef = useRef<MousePosition>({ clientX: -1, clientY: -1 });
  const targetRectRef = useRef<rect>({
    bottom: -1,
    left: -1,
    right: -1,
    top: -1,
  });

  const drop = useGridLayoutDropHandler();

  const onDragEnter = useCallback<DragEventHandler>((evt) => {
    const target = queryClosest(evt.target, `.${dropTargetClassName}`);
    if (target !== placeholderRef.current) {
      if (target) {
        placeholderRef.current = target;
        const { bottom, left, right, top } = target.getBoundingClientRect();
        targetRectRef.current.bottom = bottom;
        targetRectRef.current.left = left;
        targetRectRef.current.right = right;
        targetRectRef.current.top = top;
      }
    }
  }, []);

  const onDragLeave = useCallback<DragEventHandler>((evt) => {
    const target = queryClosest(evt.target, `.${dropTargetClassName}`);
    if (target === evt.target) {
      if (placeholderRef.current && positionRef.current) {
        if (positionRef.current) {
          placeholderRef.current.classList.remove(
            `${dropTargetClassName}-${positionRef.current}`
          );
          positionRef.current = undefined;
        }
      }
    }
  }, []);

  // We could replace this with mouse move to reduce event rate
  const onDragOver = useCallback<DragEventHandler>((evt) => {
    const target = queryClosest(evt.target, `.${dropTargetClassName}`);
    if (target) {
      evt.preventDefault();

      if (target === placeholderRef.current) {
        const { clientX, clientY } = evt;
        const { current: mousePos } = mousePosRef;

        if (clientX !== mousePos.clientX || clientY !== mousePos.clientY) {
          mousePos.clientX = clientX;
          mousePos.clientY = clientY;

          const { current: rect } = targetRectRef;

          const { pctX, pctY /*, closeToTheEdge */ } = pointPositionWithinRect(
            clientX,
            clientY,
            rect
          );

          const position = getPositionWithinBox(
            clientX,
            clientY,
            rect,
            pctX,
            pctY
          );
          const { current: lastPosition } = positionRef;

          if (position !== positionRef.current) {
            if (placeholderRef.current) {
              if (lastPosition === undefined) {
                placeholderRef.current.classList.add(
                  `${dropTargetClassName}-${position}`
                );
              } else {
                placeholderRef.current.classList.replace(
                  `${dropTargetClassName}-${lastPosition}`,
                  `${dropTargetClassName}-${position}`
                );
              }
            }
            positionRef.current = position;
          }
        }
      }
    }
  }, []);

  const onDrop = useCallback<DragEventHandler>(
    (evt) => {
      const target = queryClosest(evt.target, `.${dropTargetClassName}`);
      if (target && positionRef.current) {
        const { id } = target;
        for (const position of positions) {
          if (target.classList.contains(position)) {
            target.classList.remove(position);
            break;
          }
        }
        drop(
          id,
          JSON.parse(evt.dataTransfer.getData("text/json")),
          positionRef.current
        );

        placeholderRef.current = undefined;
        positionRef.current = undefined;
      }
    },
    [drop]
  );

  return {
    dropTargetClassName,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};
