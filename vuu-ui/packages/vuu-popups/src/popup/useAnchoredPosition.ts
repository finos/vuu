import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  getPositionRelativeToAnchor,
  Position,
} from "./getPositionRelativeToAnchor";
import { PopupComponentProps } from "./Popup";

export type AnchoredPositionHookProps = Pick<
  PopupComponentProps,
  | "anchorElement"
  | "minWidth"
  | "offsetLeft"
  | "offsetTop"
  | "placement"
  | "position"
>;

export const useAnchoredPosition = ({
  anchorElement,
  minWidth,
  offsetLeft = 0,
  offsetTop = 0,
  placement,
  position: positionProp,
}: AnchoredPositionHookProps) => {
  const popupRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | undefined>(positionProp);

  // maybe better as useMemo ?
  useLayoutEffect(() => {
    if (placement === "absolute" && positionProp) {
      setPosition(positionProp);
    } else if (anchorElement.current && placement !== "auto") {
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
  }, [anchorElement, minWidth, offsetLeft, offsetTop, placement, positionProp]);

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
