import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, RefObject } from "react";
import { useAnchoredPosition } from "./useAnchoredPosition";
import { Position } from "./getPositionRelativeToAnchor";

import popupCss from "./Popup.css";

export type PopupPlacement =
  | "absolute"
  | "auto"
  | "below"
  | "below-center"
  | "below-right"
  | "below-full-width"
  | "center"
  | "right";

export interface PopupComponentProps extends HTMLAttributes<HTMLDivElement> {
  anchorElement: RefObject<HTMLElement>;
  // TODO this is repeated in Position
  minWidth?: number | string;
  offsetLeft?: number;
  offsetTop?: number;
  placement: PopupPlacement;
  position?: Position;
}

export const PopupComponent = ({
  children,
  className,
  anchorElement,
  minWidth,
  offsetLeft,
  offsetTop,
  placement,
  position: positionProp,
}: PopupComponentProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-popup",
    css: popupCss,
    window: targetWindow,
  });

  const { popupRef, position } = useAnchoredPosition({
    anchorElement,
    minWidth,
    offsetLeft,
    offsetTop,
    placement,
    position: positionProp,
  });
  return position === undefined ? null : (
    <div className={cx(`vuuPortal`, className)} ref={popupRef} style={position}>
      {children}
    </div>
  );
};
