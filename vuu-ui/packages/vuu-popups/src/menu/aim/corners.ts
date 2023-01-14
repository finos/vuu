import { distance, bullseye, Position, Positions } from "./aim";

export type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

function inside(source: number, targetMin: number, targetMax: number) {
  if (source >= targetMin && source <= targetMax) return 0;
  else if (source > targetMin) return -1;
  else return 1;
}

export function findCorners(
  sourceEvt: MouseEvent,
  targetElement: HTMLElement
): [Corner, Corner] | [] {
  const source = { left: sourceEvt.pageX, top: sourceEvt.pageY };
  const target = targetElement.getBoundingClientRect();

  const hor = inside(source.left, target.left, target.left + target.width);
  const ver = inside(source.top, target.top, source.top + target.height);

  if (hor === -1 && ver === -1) return ["top-right", "bottom-left"];
  if (hor === -1 && ver === 0) return ["top-right", "bottom-right"];
  if (hor === -1 && ver === 1) return ["top-left", "bottom-right"];

  if (hor === 0 && ver === -1) return ["bottom-right", "bottom-left"];
  if (hor === 0 && ver === 0) return [];
  if (hor === 0 && ver === 1) return ["top-left", "top-right"];

  if (hor === 1 && ver === -1) return ["bottom-right", "top-left"];
  if (hor === 1 && ver === 0) return ["bottom-left", "top-left"];
  if (hor === 1 && ver === 1) return ["bottom-left", "top-right"];

  throw Error("cannot happen");
}

type Source = {
  left: number;
  top: number;
};

const isSource = (source: Source | Position | MouseEvent): source is Source =>
  typeof (source as Source).left === "number";
const isEvent = (
  source: Source | Position | MouseEvent
): source is MouseEvent => typeof (source as MouseEvent).pageX === "number";

export function boundaries(
  corners: [Corner, Corner] | [],
  sourcePos: Position | MouseEvent | Source,
  targetElement: HTMLElement | SVGElement,
  adjustment: false | number = false
): Positions {
  const target = targetElement.getBoundingClientRect();
  const source = isSource(sourcePos)
    ? sourcePos
    : isEvent(sourcePos)
    ? {
        left: sourcePos.pageX,
        top: sourcePos.pageY,
      }
    : {
        left: sourcePos.x,
        top: sourcePos.y,
      };

  const tolerance =
    adjustment !== false ? Math.round(adjustment / 10) * 1.5 : 0;
  const position = {
    left: target.left - tolerance,
    top: target.top - tolerance,
    width: target.width + tolerance * 2,
    height: target.height + tolerance * 2,
  };

  const doc = document.documentElement;
  const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
  const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

  let first = true;
  const positions: Position[] = [];
  corners.forEach((corner) => {
    switch (corner) {
      case "top-right":
        if (first)
          positions.push({
            x: target.left + target.width + left,
            y: target.top + top,
          });
        positions.push({
          x: position.left + position.width + left,
          y: position.top + top,
        });
        if (!first)
          positions.push({
            x: target.left + target.width + left,
            y: target.top + top,
          });
        break;
      case "top-left":
        if (first)
          positions.push({ x: target.left + left, y: target.top + top });
        positions.push({ x: position.left + left, y: position.top + top });
        if (!first)
          positions.push({ x: target.left + left, y: target.top + top });
        break;
      case "bottom-right":
        if (first)
          positions.push({
            x: target.left + target.width + left,
            y: target.top + target.height + top,
          });
        positions.push({
          x: position.left + position.width + left,
          y: position.top + position.height + top,
        });
        if (!first)
          positions.push({
            x: target.left + target.width + left,
            y: target.top + target.height + top,
          });
        break;
      case "bottom-left":
        if (first)
          positions.push({
            x: target.left + left,
            y: target.top + target.height + top,
          });
        positions.push({
          x: position.left + left,
          y: position.top + position.height + top,
        });
        if (!first)
          positions.push({
            x: target.left + left,
            y: target.top + target.height + top,
          });
        break;
    }
    if (first) {
      positions.push({ x: source.left, y: source.top });
    }
    first = false;
  });

  if (adjustment === false) {
    const be = bullseye(corners, positions as Positions, {
      x: source.left,
      y: source.top,
    });
    if (be) {
      const dist = Math.round(distance({ x: source.left, y: source.top }, be));
      return boundaries(corners, source, targetElement, dist);
    }
  }

  return positions as Positions;
}
