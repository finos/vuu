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

const removedropTargetPositionClassName = (el: HTMLElement) => {
  el.classList.forEach((className) => {
    if (className.match(/(north|east|south|west|centre|tabs)$/)) {
      el.classList.remove(className);
    }
  });
};

export const useAsDropTarget = () => {
  const dropTargetRef = useRef<HTMLElement>();
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
    if (target) {
      console.log(`enter dropTarget ${evt.target.className}
        current dropTarget ${dropTargetRef.current?.className} 
        `);
    }
    if (target !== dropTargetRef.current) {
      if (target) {
        dropTargetRef.current = target;
        const { bottom, left, right, top } = target.getBoundingClientRect();
        console.log(`set dropTarget to new target ${top} ${bottom}`);
        targetRectRef.current.bottom = bottom;
        targetRectRef.current.left = left;
        targetRectRef.current.right = right;
        targetRectRef.current.top = top;

        if (target.dataset.dropTarget === "tabs") {
          target.classList.add(`${dropTargetClassName}-tabs`);
          positionRef.current = "tabs";
        }
      }
    }
  }, []);

  const onDragLeave = useCallback<DragEventHandler>((evt) => {
    const target = queryClosest(evt.target, `.${dropTargetClassName}`);
    if (target === evt.target) {
      console.log(`drag leave ${target.className}`);

      if (target === dropTargetRef.current) {
        console.log("set dropTarget ref to undefined");
        dropTargetRef.current = undefined;
        positionRef.current = undefined;
      }

      removedropTargetPositionClassName(target);
    }
  }, []);

  // We could replace this with mouse move to reduce event rate
  const onDragOver = useCallback<DragEventHandler>((evt) => {
    const target = queryClosest(evt.target, `.${dropTargetClassName}`);
    if (target) {
      evt.preventDefault();

      if (target === dropTargetRef.current) {
        if (target.classList.contains(`${dropTargetClassName}-tabs`)) {
          removedropTargetPositionClassName(target);
          dropTargetRef.current.classList.add(`${dropTargetClassName}-tabs`);
          positionRef.current = "tabs";
        } else {
          const { clientX, clientY } = evt;
          const { current: mousePos } = mousePosRef;

          if (clientX !== mousePos.clientX || clientY !== mousePos.clientY) {
            mousePos.clientX = clientX;
            mousePos.clientY = clientY;

            const { current: rect } = targetRectRef;

            const { pctX, pctY /*, closeToTheEdge */ } =
              pointPositionWithinRect(clientX, clientY, rect);

            const position = getPositionWithinBox(
              clientX,
              clientY,
              rect,
              pctX,
              pctY
            );
            const { current: lastPosition } = positionRef;
            console.log(
              `dragOver ${target.className} last postion ${lastPosition} position ${position}`
            );

            if (position !== lastPosition) {
              if (dropTargetRef.current) {
                removedropTargetPositionClassName(target);
                dropTargetRef.current.classList.add(
                  `${dropTargetClassName}-${position}`
                );
              }
              positionRef.current = position;
            }
          }
        }
      }
    }
  }, []);

  const onDrop = useCallback<DragEventHandler>(
    (evt) => {
      let target = queryClosest(evt.target, `.${dropTargetClassName}`);
      if (target && positionRef.current) {
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
          drop(id, JSON.parse(jsonData), positionRef.current);
        } else {
          const dropId = evt.dataTransfer.getData("text/plain");
          if (dropId) {
            drop(id, dropId, positionRef.current);
            console.log(`useAsDropTarget, reposition ${dropId}`);
          } else {
            throw Error("onDrop no payload to drop");
          }
        }

        dropTargetRef.current = undefined;
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
