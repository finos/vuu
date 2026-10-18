import {
  type GridLayoutDropPosition,
  getPositionWithinBox,
  pointPositionWithinRect,
  type rect,
} from "@vuu-ui/vuu-utils";

/** Drop positions offered when dropping an example onto an example */
export type ExampleDropPosition = Exclude<GridLayoutDropPosition, "header">;

/** Where an example would be dropped, relative to the target rect */
export const dropPositionAt = (
  x: number,
  y: number,
  targetRect: rect,
): ExampleDropPosition => {
  const { pctX, pctY } = pointPositionWithinRect(x, y, targetRect);
  const position = getPositionWithinBox(x, y, targetRect, pctX, pctY);
  return position === "header" ? "north" : position;
};

/** The region, as css insets in %, the dropped example would occupy */
export const dropRegion = (position: ExampleDropPosition) => {
  switch (position) {
    case "north":
      return { bottom: "50%", left: 0, right: 0, top: 0 };
    case "south":
      return { bottom: 0, left: 0, right: 0, top: "50%" };
    case "west":
      return { bottom: 0, left: 0, right: "50%", top: 0 };
    case "east":
      return { bottom: 0, left: "50%", right: 0, top: 0 };
    default:
      return { bottom: 0, left: 0, right: 0, top: 0 };
  }
};
