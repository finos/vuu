import { PopupPlacement } from "./Popup";

export type Visibility = "hidden" | "visible";

export type Position = {
  left: number;
  minWidth?: number | string;
  top: number;
  visibility?: Visibility;
  width?: number;
};

export const getPositionRelativeToAnchor = (
  anchorElement: HTMLElement,
  placement: PopupPlacement,
  offsetLeft: number,
  offsetTop: number,
  minWidth?: number | string,
  dimensions?: { height: number; width: number }
): {
  left: number;
  minWidth?: number | string;
  top: number;
  visibility?: Visibility;
  width?: number;
} => {
  const { bottom, height, left, right, top, width } =
    anchorElement.getBoundingClientRect();
  switch (placement) {
    case "below":
      return { left: left + offsetLeft, top: bottom + offsetTop };
    case "right":
      return { left: right + offsetLeft, top: top + offsetTop };
    case "below-center":
      return { left: left + width / 2 + offsetLeft, top: bottom + offsetTop };
    case "below-right":
      return { left: left, minWidth, top: bottom + offsetTop };
    case "below-full-width":
      return {
        left: left + offsetLeft,
        minWidth,
        top: bottom + offsetTop,
        width,
      };
    case "center":
      if (dimensions) {
        return {
          left: width / 2 - dimensions.width / 2 + offsetLeft,
          top: height / 2 - dimensions.height / 2 + offsetTop,
          visibility: "visible",
        };
      } else {
        return {
          left: width / 2 + offsetLeft,
          top: height / 2 + offsetTop,
          visibility: "hidden",
        };
      }
    default:
      throw Error(
        `Popup getPositionRelativeToAnchor non-supported placement value ${placement}`
      );
  }
};
