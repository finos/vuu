export interface rect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}
export type rectTuple = [number, number, number, number];

export type dimension = "width" | "height";

export function boxContainsPoint(rect: rect, x: number, y: number) {
  if (rect) {
    return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
  }
}

export function getCenteredBox(
  { right, left, top, bottom }: rect,
  pctSize: number
) {
  const pctOffset = (1 - pctSize) / 2;
  const w = (right - left) * pctOffset;
  const h = (bottom - top) * pctOffset;
  return { left: left + w, top: top + h, right: right - w, bottom: bottom - h };
}

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

export type GridLayoutSplitDirection = "north" | "south" | "east" | "west";

export type GridLayoutDropPosition = GridLayoutSplitDirection | "centre";

export function getPositionWithinBox(
  x: number,
  y: number,
  rect: rect,
  pctX: number,
  pctY: number
): GridLayoutDropPosition {
  const centerBox = getCenteredBox(rect, 0.2);
  if (boxContainsPoint(centerBox, x, y)) {
    return "centre";
  } else {
    const quadrant = `${pctY < 0.5 ? "north" : "south"}${
      pctX < 0.5 ? "west" : "east"
    }`;

    switch (quadrant) {
      case "northwest":
        return pctX > pctY ? "north" : "west";
      case "northeast":
        return 1 - pctX > pctY ? "north" : "east";
      case "southeast":
        return pctX > pctY ? "east" : "south";
      case "southwest":
        return 1 - pctX > pctY ? "west" : "south";
      default:
        throw Error("getPositionWithinBox failed top compute position");
    }
  }
}
