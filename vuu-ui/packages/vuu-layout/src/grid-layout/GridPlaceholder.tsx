import { rect, queryClosest, boxContainsPoint } from "@finos/vuu-utils";
import { MousePosition } from "@finos/vuu-ui-controls";
import { DragEventHandler, HTMLAttributes, useCallback, useRef } from "react";

import "./GridPlaceholder.css";

function getCenteredBox({ right, left, top, bottom }: rect, pctSize: number) {
  const pctOffset = (1 - pctSize) / 2;
  const w = (right - left) * pctOffset;
  const h = (bottom - top) * pctOffset;
  return { left: left + w, top: top + h, right: right - w, bottom: bottom - h };
}

export type DropPosition = "NORTH" | "SOUTH" | "EAST" | "WEST" | "CENTRE";

export type GridLayoutDropHandler = (
  targetId: string,
  payloadId: string,
  position: DropPosition
) => void;

const classBase = "vuuGridPlaceholder";

export function pointPositionWithinRect(
  x: number,
  y: number,
  rect: rect,
  borderZone = 30
) {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const posX = x - rect.left;
  const posY = y - rect.top;
  let closeToTheEdge = 0;

  if (posX < borderZone) closeToTheEdge += 8;
  if (posX > width - borderZone) closeToTheEdge += 2;
  if (posY < borderZone) closeToTheEdge += 1;
  if (posY > height - borderZone) closeToTheEdge += 4;

  return { pctX: posX / width, pctY: posY / height, closeToTheEdge };
}

function getPositionWithinBox(
  x: number,
  y: number,
  rect: rect,
  pctX: number,
  pctY: number
) {
  const centerBox = getCenteredBox(rect, 0.2);
  if (boxContainsPoint(centerBox, x, y)) {
    return "CENTRE";
  } else {
    const quadrant = `${pctY < 0.5 ? "north" : "south"}${
      pctX < 0.5 ? "west" : "east"
    }`;

    switch (quadrant) {
      case "northwest":
        return pctX > pctY ? "NORTH" : "WEST";
      case "northeast":
        return 1 - pctX > pctY ? "NORTH" : "EAST";
      case "southeast":
        return pctX > pctY ? "EAST" : "SOUTH";
      case "southwest":
        return 1 - pctX > pctY ? "WEST" : "SOUTH";
      default:
        return "";
    }
  }
}

export interface GridPlaceholderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onDrop"> {
  debugLabel?: string;
  onDrop: GridLayoutDropHandler;
}

export const GridPlaceholder = ({
  onDrop,
  ...htmlAttributes
}: GridPlaceholderProps) => {
  const placeholderRef = useRef<HTMLElement>();
  const positionRef = useRef<string>("");
  const mousePosRef = useRef<MousePosition>({ clientX: -1, clientY: -1 });
  const targetRectRef = useRef<rect>({
    bottom: -1,
    left: -1,
    right: -1,
    top: -1,
  });

  const onDragEnter = useCallback<DragEventHandler>((evt) => {
    console.log(`drag enter ${evt.target.id}`);
    const target = queryClosest(evt.target, ".vuuGridPlaceholder");
    if (target) {
      placeholderRef.current = target;
      const { bottom, left, right, top } = target.getBoundingClientRect();
      targetRectRef.current.bottom = bottom;
      targetRectRef.current.left = left;
      targetRectRef.current.right = right;
      targetRectRef.current.top = top;
    }
  }, []);
  const onDragLeave = useCallback<DragEventHandler>((evt) => {
    if (placeholderRef.current && positionRef.current) {
      if (positionRef.current !== "") {
        placeholderRef.current.classList.remove(
          `${classBase}-${positionRef.current}`
        );
        positionRef.current = "";
      }
    }
  }, []);
  const onDragOver = useCallback<DragEventHandler>((evt) => {
    evt.preventDefault();
    const { clientX, clientY } = evt;
    const { current: mousePos } = mousePosRef;
    if (clientX !== mousePos.clientX || clientY !== mousePos.clientY) {
      mousePos.clientX = clientX;
      mousePos.clientY = clientY;

      const { current: rect } = targetRectRef;

      const { pctX, pctY, closeToTheEdge } = pointPositionWithinRect(
        clientX,
        clientY,
        rect
      );

      const position = getPositionWithinBox(clientX, clientY, rect, pctX, pctY);
      const { current: lastPosition } = positionRef;
      if (position !== positionRef.current) {
        if (placeholderRef.current) {
          if (lastPosition === "") {
            placeholderRef.current.classList.add(`${classBase}-${position}`);
          } else {
            placeholderRef.current.classList.replace(
              `${classBase}-${lastPosition}`,
              `${classBase}-${position}`
            );
          }
        }
        positionRef.current = position;
      }
    }
  }, []);

  const handleDrop = useCallback<DragEventHandler>(
    (evt) => {
      console.log("onDrop");
      onDrop(
        placeholderRef.current.id,
        evt.dataTransfer.getData("text/plain"),
        positionRef.current
      );
    },
    [onDrop]
  );

  return (
    <div
      {...htmlAttributes}
      className={classBase}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    />
  );
};
