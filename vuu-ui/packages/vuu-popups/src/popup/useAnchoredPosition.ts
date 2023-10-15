import { RefObject, useLayoutEffect, useState } from "react";
import { PopupPlacement } from "./Popup";

export interface AnchoredPositionHookProps {
  anchorElement: RefObject<HTMLElement>;
  minWidth?: number;
  offsetLeft?: number;
  offsetTop?: number;
  placement: PopupPlacement;
}

const getPositionRelativeToAnchor = (
  anchorElement: HTMLElement,
  placement: PopupPlacement,
  offsetLeft: number,
  offsetTop: number,
  minWidth?: number
): { left: number; minWidth?: number; top: number; width?: number } => {
  const { bottom, left, right, top, width } =
    anchorElement.getBoundingClientRect();
  switch (placement) {
    case "below":
      return { left: left + offsetLeft, top: bottom + offsetTop };
    case "right":
      return { left: right + offsetLeft, top: top + offsetTop };
    case "below-center":
      return { left: left + width / 2 + offsetLeft, top: bottom + offsetTop };
    case "below-full-width":
      return {
        left: left + offsetLeft,
        minWidth,
        top: bottom + offsetTop,
        width,
      };
    default:
      throw Error(
        "Popup getPositionRelativeToAnchor only supported placement values are below and right"
      );
  }
};

export const useAnchoredPosition = ({
  anchorElement,
  minWidth,
  offsetLeft = 0,
  offsetTop = 0,
  placement,
}: AnchoredPositionHookProps) => {
  const [position, setPosition] = useState<
    { left: number; top: number } | undefined
  >();
  // maybe better as useMemo ?
  useLayoutEffect(() => {
    if (anchorElement.current) {
      const position = getPositionRelativeToAnchor(
        anchorElement.current,
        placement,
        offsetLeft,
        offsetTop,
        minWidth
      );
      setPosition(position);
    }
  }, [anchorElement, minWidth, offsetLeft, offsetTop, placement]);

  return position;
};
