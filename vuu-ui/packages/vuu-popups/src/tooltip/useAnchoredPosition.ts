// TODO merge with Popup

import { RefObject, useLayoutEffect, useState } from "react";

export type TooltipPlacement = "above" | "right" | "below" | "left";

export interface AnchoredPositionHookProps {
  anchorElement: RefObject<HTMLElement>;
  offsetLeft?: number;
  offsetTop?: number;
  placement: TooltipPlacement;
}

const getPositionRelativeToAnchor = (
  anchorElement: HTMLElement,
  placement: TooltipPlacement,
  offsetLeft: number,
  offsetTop: number
): { left: number; top: number } => {
  const { bottom, height, left, right, top, width } =
    anchorElement.getBoundingClientRect();
  const midX = left + width / 2;
  const midY = top + height / 2;

  switch (placement) {
    case "above":
      return { left: midX + offsetLeft, top: top + offsetTop };
    case "below":
      return { left: midX + offsetLeft, top: bottom + offsetTop };
    case "right":
      return { left: right + offsetLeft, top: midY + offsetLeft };
    // case "below-center":
    //   return { left: left + width / 2 + offsetLeft, top: bottom + offsetTop };
    case "left":
      return { left: left + offsetLeft, top: midY + offsetLeft };
    default:
      throw Error(
        "Tooltip getPositionRelativeToAnchor only supported placement values are left, right, below and right"
      );
  }
};

export const useAnchoredPosition = ({
  anchorElement,
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
        offsetTop
      );
      setPosition(position);
    }
  }, [anchorElement, offsetLeft, offsetTop, placement]);

  return position;
};
