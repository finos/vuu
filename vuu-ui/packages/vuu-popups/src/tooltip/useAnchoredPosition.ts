// TODO merge with Popup

import { RefCallback, RefObject, useCallback, useLayoutEffect } from "react";

export type TooltipPlacement = "above" | "right" | "below" | "left";

const pointerSize = 12;
export interface AnchoredPositionHookProps {
  anchorElement: RefObject<HTMLElement>;
  offsetLeft?: number;
  offsetTop?: number;
  placement: TooltipPlacement | TooltipPlacement[];
}

const roomAbove = (anchor: DOMRect, height: number) => height < anchor.top;
const roomBelow = (anchor: DOMRect, height: number) =>
  document.body.clientHeight - anchor.bottom > height;

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

export const useAnchoredPosition = ({
  anchorElement,
  offsetLeft = 0,
  offsetTop = 0,
  placement,
}: AnchoredPositionHookProps) => {
  const ref = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el && anchorElement.current) {
        const anchor = anchorElement.current.getBoundingClientRect();
        const { height, width } = el.getBoundingClientRect();
        let nextPlacement: TooltipPlacement | undefined;
        let placements: TooltipPlacement | TooltipPlacement[] = placement;
        do {
          [nextPlacement, placements] = getNextPlacement(placements);
          switch (nextPlacement) {
            case "above":
              if (roomAbove(anchor, height + pointerSize)) {
                const midDiff = (width - anchor.width) / 2;
                el.style.cssText = `left:${anchor.left - midDiff}px;top:${
                  anchor.top - height - pointerSize
                }px;opacity: 1;`;
                el.dataset.align = "above";
                return;
              }
              break;
            case "below":
              if (roomBelow(anchor, height + pointerSize)) {
                const midDiff = (width - anchor.width) / 2;
                el.style.cssText = `left:${anchor.left - midDiff}px;top:${
                  anchor.bottom + pointerSize
                }px;opacity: 1;`;
                el.dataset.align = "below";
                return;
              }
              break;

            case "right":
              console.log("place the fucker right");
              break;
            case "left":
              console.log("place the fucker left");
              break;
            default:
              console.warn(`unklnown tooltip placement ${placement}`);
          }
        } while (nextPlacement);
      }

      // el?.classList.remove("vuuHidden");
    },
    [anchorElement, placement]
  );
  // const [position, setPosition] = useState<
  //   { left: number; top: number } | undefined
  // >();

  // maybe better as useMemo ?
  useLayoutEffect(() => {
    // if (anchorElement.current) {
    //   const position = getPositionRelativeToAnchor(
    //     anchorElement.current,
    //     placement,
    //     offsetLeft,
    //     offsetTop
    //   );
    //   setPosition(position);
    // }
  }, [anchorElement, offsetLeft, offsetTop, placement]);

  return ref;
};
