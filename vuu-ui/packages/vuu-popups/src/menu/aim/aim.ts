import { findCorners, boundaries, Corner } from "./corners";

export type Point = [number, number];

export type Position = {
  x: number;
  y: number;
};

export type Positions = [Position, Position];

export function distance(source: Position, target: Position) {
  const a = source.x - target.x;
  const b = source.y - target.y;
  return Math.sqrt(a * a + b * b);
}

export function pointInPolygon(point: Point, vs: Point[]) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  const [x, y] = point;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0],
      yi = vs[i][1];
    const xj = vs[j][0],
      yj = vs[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export type Side =
  | "right"
  | "top-right"
  | "top"
  | "top-left"
  | "left"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export function side(corners: [Corner, Corner] | []): Side {
  if (corners[0] === "top-right" && corners[1] === "bottom-right")
    return "right";
  else if (corners[0] === "top-left" && corners[1] === "bottom-right")
    return "top-right";
  else if (corners[0] === "top-left" && corners[1] === "top-right")
    return "top";
  else if (corners[0] === "bottom-left" && corners[1] === "top-right")
    return "top-left";
  else if (corners[0] === "bottom-left" && corners[1] === "top-left")
    return "left";
  else if (corners[0] === "bottom-right" && corners[1] === "top-left")
    return "bottom-left";
  else if (corners[0] === "bottom-right" && corners[1] === "bottom-left")
    return "bottom";
  else if (corners[0] === "top-right" && corners[1] === "bottom-left")
    return "bottom-right";

  throw Error("will never happen, typescript");
}

export function bullseye(
  corners: [Corner, Corner] | [],
  boundaries: [Position, Position],
  mousePosition: Position
): Position {
  switch (side(corners)) {
    case "right":
      return {
        x: boundaries[0].x,
        y: mousePosition.y,
      };
    case "top-right":
      return {
        x: boundaries[1].x,
        y: boundaries[0].y,
      };
    case "top":
      return {
        x: mousePosition.x,
        y: boundaries[0].y,
      };
    case "top-left":
      return {
        x: boundaries[0].x,
        y: boundaries[1].y,
      };
    case "left":
      return {
        x: boundaries[0].x,
        y: mousePosition.y,
      };
    case "bottom-left":
      return {
        x: boundaries[1].x,
        y: boundaries[0].y,
      };
    case "bottom":
      return {
        x: mousePosition.x,
        y: boundaries[0].y,
      };
    case "bottom-right":
      return {
        x: boundaries[0].x,
        y: boundaries[1].y,
      };
  }
}

function formatPoints(points: Position[]) {
  const finalPoints: Point[] = [];
  for (let i = 0, len = points.length; i < len; ++i) {
    finalPoints.push([points[i].x, points[i].y]);
  }
  return finalPoints;
}

export function aiming(
  e: MouseEvent,
  mousePosition: Position,
  prevMousePosition: Position,
  target: HTMLElement,
  alreadyAiming: boolean
) {
  if (!prevMousePosition) return false;
  else if (
    !alreadyAiming &&
    mousePosition.x === prevMousePosition.x &&
    mousePosition.y === prevMousePosition.y
  ) {
    return false;
  }

  const corners = findCorners(e, target);
  const bound = boundaries(corners, prevMousePosition, target);

  if (pointInPolygon([mousePosition.x, mousePosition.y], formatPoints(bound))) {
    const dist = Math.round(
      distance(mousePosition, bullseye(corners, bound, mousePosition))
    );
    return Math.max(dist, 1);
  }
  return false;
}
