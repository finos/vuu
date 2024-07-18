// TODO merge with Popup

import { RefCallback, RefObject, useCallback } from "react";

export type TooltipPlacement = "above" | "right" | "below" | "left";

const pointerSize = 12;
export interface TooltipAnchoredPositionHookProps {
  anchorElement: RefObject<HTMLElement>;
  placement: TooltipPlacement | TooltipPlacement[];
}

const roomAbove = (anchor: DOMRect, tooltip: DOMRect) =>
  tooltip.height + pointerSize < anchor.top;
const roomLeft = (anchor: DOMRect, tooltip: DOMRect) =>
  tooltip.width + pointerSize < anchor.left;
const roomRight = (anchor: DOMRect, tooltip: DOMRect) =>
  anchor.right + tooltip.width + pointerSize < document.body.clientWidth;
const roomBelow = (anchor: DOMRect, tooltip: DOMRect) =>
  document.body.clientHeight - anchor.bottom > tooltip.height + pointerSize;

const roomAvailableAtPlacement = (
  placement: TooltipPlacement,
  anchor: DOMRect,
  tooltip: DOMRect
) => {
  switch (placement) {
    case "above":
      return roomAbove(anchor, tooltip);
    case "left":
      return roomLeft(anchor, tooltip);
    case "below":
      return roomBelow(anchor, tooltip);
    case "right":
      return roomRight(anchor, tooltip);
    default:
      throw Error("invalid tooltip placement");
  }
};

type Position = { left: number; top: number };
type Positioner = (anchorRect: DOMRect, tooltipRect: DOMRect) => Position;

const positionAbove: Positioner = (anchor, tooltip) => ({
  left: anchor.left - (tooltip.width - anchor.width) / 2,
  top: anchor.top - (tooltip.height + pointerSize),
});

const positionBelow: Positioner = (anchor, tooltip) => ({
  left: anchor.left - (tooltip.width - anchor.width) / 2,
  top: anchor.bottom + pointerSize,
});
const positionLeft: Positioner = (anchor, tooltip) => ({
  left: anchor.left - pointerSize - tooltip.width,
  top: anchor.top - (tooltip.height - anchor.height) / 2,
});

const positionRight: Positioner = (anchor, tooltip) => ({
  left: anchor.right + pointerSize,
  top: anchor.top - (tooltip.height - anchor.height) / 2,
});

const positionAtPlacement = (
  placement: TooltipPlacement,
  anchor: DOMRect,
  tooltip: DOMRect
) => {
  switch (placement) {
    case "above":
      return positionAbove(anchor, tooltip);
    case "left":
      return positionLeft(anchor, tooltip);
    case "below":
      return positionBelow(anchor, tooltip);
    case "right":
      return positionRight(anchor, tooltip);
    default:
      throw Error("invalid tooltip placement");
  }
};

const keepWithinTheScreen = (
  { height, width }: DOMRect,
  position: Position
) => {
  const { clientWidth, clientHeight } = document.body;
  let { left, top } = position;
  if (left + width > clientWidth) {
    left -= left + width - clientWidth;
  }
  if (left < 0) {
    left = 0;
  }
  if (top + height > clientHeight) {
    top -= top + height - clientHeight;
  }
  if (top < 0) {
    top = 0;
  }

  return { left, top };
};

const toCSSText = ({ left, top }: Position) =>
  `left:${left}px;top:${top}px;opacity:1;`;

const getNextPlacement = (
  placement: TooltipPlacement | TooltipPlacement[]
): [TooltipPlacement | undefined, TooltipPlacement[]] => {
  if (Array.isArray(placement)) {
    if (placement.length === 0) {
      return [undefined, placement];
    } else {
      return [placement[0], placement.slice(1)];
    }
  } else {
    return [placement, []];
  }
};

export const useTooltipAnchoredPosition = ({
  anchorElement,
  placement,
}: TooltipAnchoredPositionHookProps) => {
  const ref = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el && anchorElement.current) {
        const anchorRect = anchorElement.current.getBoundingClientRect();
        const tooltipRect = el.getBoundingClientRect();
        let nextPlacement: TooltipPlacement | undefined;
        let placements: TooltipPlacement | TooltipPlacement[] = placement;
        [nextPlacement = "right", placements] = getNextPlacement(placements);
        do {
          if (
            roomAvailableAtPlacement(nextPlacement, anchorRect, tooltipRect)
          ) {
            el.style.cssText = toCSSText(
              keepWithinTheScreen(
                tooltipRect,
                positionAtPlacement(nextPlacement, anchorRect, tooltipRect)
              )
            );
            el.dataset.align = nextPlacement;
            return;
          }
          [nextPlacement, placements] = getNextPlacement(placements);
        } while (nextPlacement);
      }
      el?.classList.remove("vuuHidden");
    },
    [anchorElement, placement]
  );
  return ref;
};
