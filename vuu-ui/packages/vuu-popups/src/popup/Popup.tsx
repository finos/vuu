import cx from "classnames";
import { useThemeAttributes } from "@finos/vuu-shell";
import { HTMLAttributes, RefObject } from "react";
import { Position, useAnchoredPosition } from "./useAnchoredPosition";

import "./Popup.css";

export type PopupPlacement =
  | "absolute"
  | "below"
  | "below-center"
  | "below-full-width"
  | "center"
  | "right";

export interface PopupComponentProps extends HTMLAttributes<HTMLDivElement> {
  anchorElement: RefObject<HTMLElement>;
  minWidth?: number;
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
  placement,
  position: positionProp,
}: PopupComponentProps) => {
  const { popupRef, position } = useAnchoredPosition({
    anchorElement,
    minWidth,
    placement,
    position: positionProp,
  });
  return position === undefined ? null : (
    <div className={cx(`vuuPortal`, className)} ref={popupRef} style={position}>
      {children}
    </div>
  );
};
