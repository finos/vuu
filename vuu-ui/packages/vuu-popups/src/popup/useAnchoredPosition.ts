import {
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PopupPlacement } from "./Popup";

export interface AnchoredPositionHookProps {
  anchorElement: RefObject<HTMLElement>;
  minWidth?: number;
  offsetLeft?: number;
  offsetTop?: number;
  placement: PopupPlacement;
}

export type Visibility = "hidden" | "visible";

const getPositionRelativeToAnchor = (
  anchorElement: HTMLElement,
  placement: PopupPlacement,
  offsetLeft: number,
  offsetTop: number,
  minWidth?: number,
  dimensions?: { height: number; width: number }
): {
  left: number;
  minWidth?: number;
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
        "Popup getPositionRelativeToAnchor only supported placement values are below and right"
      );
  }
};

export type Position = {
  left: number;
  minWidth?: number;
  top: number;
  visibility?: Visibility;
  width?: number;
};

export const useAnchoredPosition = ({
  anchorElement,
  minWidth,
  offsetLeft = 0,
  offsetTop = 0,
  placement,
}: AnchoredPositionHookProps) => {
  const popupRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | undefined>();

  // maybe better as useMemo ?
  useLayoutEffect(() => {
    if (anchorElement.current) {
      const dimensions =
        popupRef.current === null
          ? undefined
          : popupRef.current.getBoundingClientRect();
      const position = getPositionRelativeToAnchor(
        anchorElement.current,
        placement,
        offsetLeft,
        offsetTop,
        minWidth,
        dimensions
      );
      setPosition(position);
    }
  }, [anchorElement, minWidth, offsetLeft, offsetTop, placement]);

  const popupCallbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      popupRef.current = el;
      if (el && placement === "center" && anchorElement.current) {
        const { height, width } = el.getBoundingClientRect();
        setPosition(
          getPositionRelativeToAnchor(
            anchorElement.current,
            placement,
            offsetLeft,
            offsetTop,
            undefined,
            { height, width }
          )
        );
      }
    },
    [anchorElement, offsetLeft, offsetTop, placement]
  );

  return {
    position,
    popupRef: placement === "center" ? popupCallbackRef : undefined,
  };
};
